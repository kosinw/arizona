import {
  SyntaxNativeType,
  SyntaxNode,
  SyntaxStaticType,
  SyntaxType,
} from '../parser/types';
import binaryen from 'binaryen';
import invariant from 'invariant';
import { transform } from '../common/transform';
import { Nullable, TransformCallback, TransformMap } from '../common/types';
import {
  BlockSymbolTable,
  FunctionSymbolTable,
  GlobalSymbolTable,
  GlobalSymbolTablePortationType,
} from '../semantics/types';
import { exitScope, lookup, lookupFunction } from '../semantics/symtab';
import cuid from 'cuid';
import * as _ from 'lodash';

const binopTable: Record<string, string> = {
  '+': 'add',
  '-': 'sub',
  '*': 'mul',
  '/': 'div_s',
  '%': 'rem_s',
  '<<': 'shl',
  '>>': 'shr_s',
  '^': 'xor',
  '&': 'and',
  '|': 'or',
  '==': 'eq',
  '!=': 'ne',
  '<': 'lt_s',
  '>': 'gt_s',
  '<=': 'le_s',
  '>=': 'ge_s',
};

const unopTable: Record<string, string> = {
  '!': 'eqz',
  '+': 'abs',
};

const typeTable: Record<SyntaxStaticType, SyntaxNativeType> = {
  [SyntaxNativeType.Bool]: SyntaxNativeType.I32,
};

const nativeTypeRanking: Record<SyntaxStaticType, number> = {
  [SyntaxNativeType.I32]: 0,
  [SyntaxNativeType.I64]: 1,
  [SyntaxNativeType.F32]: 1,
  [SyntaxNativeType.F64]: 2,
};

const typeConversionTable: Record<string, string> = {
  [`${SyntaxNativeType.I64}->${SyntaxNativeType.I32}`]: 'i32.wrap',
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.I32}`]: 'nop',
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.I32}`]: 'i32.trunc_s.f32',
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.I32}`]: 'i32.trunc_s.f64',

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.I64}`]: 'nop',
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.I64}`]: 'i64.extend_s',
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.I64}`]: 'i64.trunc_s.f32',
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.I64}`]: 'i64.trunc_s.f64',

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.F32}`]: 'f32.convert_s.i64',
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.F32}`]: 'f32.convert_s.i32',
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.F32}`]: 'nop',
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.F32}`]: 'f32.demote',

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.F64}`]: 'f64.convert_s.i64',
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.F64}`]: 'f64.convert_s.i32',
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.F64}`]: 'f64.promote',
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.F64}`]: 'nop',
};

function binaryenType(type: SyntaxStaticType): binaryen.Type {
  const t = nativeType(type);
  if (t in binaryen) {
    return binaryen[t];
  }
  return binaryen.none;
}

function typecast(
  from: SyntaxStaticType,
  to: SyntaxStaticType,
  mod: binaryen.Module
): (x: binaryen.ExpressionRef) => binaryen.ExpressionRef {
  const predicate = `${nativeType(from)}->${nativeType(to)}`;
  const cmd = typeConversionTable[predicate];

  return _.get(mod, cmd);
}

function typecastToGreaterType(
  a: SyntaxStaticType,
  b: SyntaxStaticType,
  mod: binaryen.Module
): (x: binaryen.ExpressionRef) => binaryen.ExpressionRef {
  const an = nativeType(a);
  const bn = nativeType(b);

  if (nativeTypeRanking[nativeType(a)] > nativeTypeRanking[nativeType(b)]) {
    return typecast(b, a, mod);
  }

  return typecast(a, b, mod);
}

function greaterType(
  a: SyntaxStaticType,
  b: SyntaxStaticType
): SyntaxStaticType {
  if (nativeTypeRanking[nativeType(a)] > nativeTypeRanking[nativeType(b)]) {
    return a;
  }

  return b;
}

function tryPromote(
  from: SyntaxStaticType,
  to: SyntaxStaticType,
  mod: binaryen.Module
): Nullable<(x: binaryen.ExpressionRef) => binaryen.ExpressionRef> {
  if (nativeTypeRanking[to] > nativeTypeRanking[from]) {
    return typecast(from, to, mod);
  }

  return null;
}

function nativeType(t: SyntaxStaticType): SyntaxNativeType {
  if (t in binaryen) {
    return t as SyntaxNativeType;
  } else if (t in typeTable) {
    return typeTable[t];
  }

  invariant(false, 'no native type for given type');
}

function prefixModuleMember(name: string): string {
  return 'module/' + name;
}

function filterNull<T>(arr: Nullable<T>[]): T[] {
  return arr.filter((val) => val != null) as T[];
}

// all of this is so hacky and probably deserves to be burned in a fire
export function generate(
  ast: SyntaxNode,
  symtab: GlobalSymbolTable
): binaryen.Module {
  const globalModule = new binaryen.Module();

  let currentScope: Nullable<BlockSymbolTable> = null;
  let currentRetValue: Nullable<SyntaxStaticType> = null;
  const loopLabelStack: string[] = [];

  // @ts-ignore
  const emptyBlock = globalModule.block(null, []);

  // @ts-ignore
  globalModule.setMemory(1, 16, 'memory');

  const declareGlobalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const qualifiedName = prefixModuleMember(node.value);
    const globalEntry = lookup(symtab, node.value)!;
    const isMutable = !globalEntry.immutable;
    const t = binaryenType(globalEntry.staticType);

    // TODO(kosi): Abstract this out
    const lt = nativeType(globalEntry.staticType);
    const rt = nativeType(node.params[0].staticType);

    // Try integer promotion otherwise just raise an error
    let rexpr = children[0]!;

    if (lt !== rt) {
      const promotion = tryPromote(rt, lt, globalModule);

      if (!!promotion) {
        rexpr = promotion(rexpr);
      } else {
        invariant(
          false,
          'left-hand side type does not match right-hand side type'
        );
      }
    }

    return globalModule.addGlobal(qualifiedName, t, isMutable, rexpr);
  };

  const declareLocalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const localSymbol = lookup(currentScope!, node.value)!;
    // TODO(kosi): Abstract this out
    const lt = nativeType(localSymbol.staticType);
    const rt = nativeType(node.params[0].staticType);

    // Try integer promotion otherwise just raise an error
    let rExpr = children[0]!;

    if (lt !== rt) {
      const promotion = tryPromote(rt, lt, globalModule);

      if (!!promotion) {
        rExpr = promotion(rExpr);
      } else {
        invariant(
          false,
          'left-hand side type does not match right-hand side type'
        );
      }
    }

    return globalModule.local.set(localSymbol.localId!, rExpr);
  };

  const numberLiteral: TransformCallback<binaryen.Type> = (node, _chidlren) =>
    globalModule[nativeType(node.staticType)].const(node.value);

  const traverseMap: TransformMap<binaryen.Type> = {
    [SyntaxType.FunctionDeclaration]: {
      pre(node) {
        currentScope = symtab.functions[node.value];
        currentRetValue = (currentScope as FunctionSymbolTable).returnValue
          ?.staticType!;
      },
      callback(node, _children) {
        const { value: procName } = node;
        const fnTable: FunctionSymbolTable = symtab.functions[procName];

        const procReturnType = binaryenType(fnTable.returnValue!.staticType);
        const procParamType = binaryen.createType(
          Object.values(fnTable.symbols).map((sym) =>
            binaryenType(sym.staticType)
          )
        );
        const numProcParams = Object.keys(fnTable.symbols).length;
        const procLocals = Object.values(
          fnTable.locals
            .slice(numProcParams)
            .map((sym) => binaryenType(sym.staticType))
        );

        return globalModule.addFunction(
          prefixModuleMember(procName),
          procParamType,
          procReturnType,
          procLocals,
          _children[2] || emptyBlock
        );
      },
      post(node) {
        currentScope = exitScope(currentScope);
        currentRetValue = null;
      },
    },

    [SyntaxType.Block]: {
      pre(node) {
        invariant(currentScope != null, 'current scope is null');
        currentScope = currentScope.blocks[currentScope.lastVisitedBlock++];
      },
      callback(node, children) {
        const stmts = filterNull(children);
        // @ts-ignore
        return globalModule.block(null, stmts);
      },
      post(node) {
        currentScope = exitScope(currentScope);
      },
    },

    [SyntaxType.LoopStatement]: {
      pre(_) {
        loopLabelStack.push('loop/' + cuid());
      },
      callback(_, children) {
        const labelName = loopLabelStack[loopLabelStack.length - 1];

        // 4th child is optional
        // @ts-ignore
        return globalModule.block(null, [
          children[0]!,
          globalModule.loop(
            labelName,
            // @ts-ignore
            globalModule.block(labelName + '/continue', [
              children[2]!,
              globalModule.if(
                children[1]!,
                children[3] || globalModule.nop(),
                globalModule.br(labelName)
              ),
            ])
          ),
        ]);
      },
      post(_) {
        loopLabelStack.pop();
      },
    },

    [SyntaxType.BreakStatement]: (node, children) => {
      invariant(loopLabelStack.length > 0, 'must be currently in a loop');
      const labelName = loopLabelStack[loopLabelStack.length - 1];
      return globalModule.br(labelName);
    },

    [SyntaxType.ContinueStatement]: (node, children) => {
      invariant(loopLabelStack.length > 0, 'must be currently in a loop');
      const labelName = loopLabelStack[loopLabelStack.length - 1];
      return globalModule.br(labelName + '/continue');
    },

    [SyntaxType.FunctionCall]: (node, children) => {
      // TODO(kosi): This will 100% break with access types
      const fn = lookupFunction(symtab, node.value)!;
      const retType = nativeType(fn.returnValue?.staticType!);

      invariant(
        Object.values(fn.symbols).length === children.length,
        `number of arguments for function '${node.value}' is incorrect`
      );
      node.staticType = retType;

      if (!(node.value in symtab.imports)) {
        return globalModule.call(
          prefixModuleMember(node.value),
          children.map((c) => c!),
          binaryenType(retType)
        );
      }
    },

    [SyntaxType.Noop]: (node, children) => globalModule.nop(),

    [SyntaxType.GlobalImmutableDeclaration]: declareGlobalVariable,

    [SyntaxType.GlobalVariableDeclaration]: declareGlobalVariable,

    [SyntaxType.ImmutableDeclaration]: declareLocalVariable,

    [SyntaxType.VariableDeclaration]: declareLocalVariable,

    [SyntaxType.IntegerLiteral]: numberLiteral,

    [SyntaxType.FloatLiteral]: numberLiteral,

    [SyntaxType.Export]: (node, _) => {
      // First figure out whether its a global variable or function being exported
      const exportName = node.params[0].value;
      const exportType = symtab.exports[exportName];

      if (exportType === GlobalSymbolTablePortationType.Function) {
        return globalModule.addFunctionExport(
          prefixModuleMember(exportName),
          exportName
        );
      } else if (exportType === GlobalSymbolTablePortationType.Global) {
        invariant(
          symtab.symbols[exportName].immutable,
          'exported global variables must be immutable'
        );

        return globalModule.addGlobalExport(
          prefixModuleMember(exportName),
          exportName
        );
      }
    },

    [SyntaxType.BinaryExpression]: (node, children) => {
      // TODO(kosi): Add a switch-case table here
      const [l, rhs] = node.params;
      if (node.value in binopTable) {
        let operator = binopTable[node.value];

        const type =
          node.value === '||' || node.value === '&&'
            ? nativeType('bool')
            : nativeType(greaterType(l.staticType, rhs.staticType));

        // NOTE(kosi): Very big hack, but remove _s for floatingd types and add _u for unsigned types
        if (type.indexOf('f') !== -1) {
          operator = operator.replace('_s', '');
        } else if (type.indexOf('u') !== -1) {
          operator = operator.replace('_s', '_u');
        }

        node.staticType = type;

        let lexpr = children[0]!;
        let rexpr = children[1]!;

        if (l.staticType !== rhs.staticType) {
          const cast = typecastToGreaterType(
            l.staticType,
            rhs.staticType,
            globalModule
          );

          if (greaterType(l.staticType, rhs.staticType) === l.staticType) {
            rexpr = cast(rexpr);
          } else {
            lexpr = cast(lexpr);
          }
        }

        let r = globalModule[type][operator](lexpr, rexpr);

        // NOTE(kosi): This means this is just an expression statement, we should drop this value
        if (node.parent?.type === SyntaxType.Block) {
          return globalModule.drop(r);
        }

        return r;
      }

      invariant(false, `unknown binary operator used: ${node.value}`);
    },

    [SyntaxType.TypecastExpression]: (node, children) => {
      const castExpr = typecast(
        node.params[0].staticType,
        node.staticType,
        globalModule
      );

      return castExpr(children[0]!);
    },

    // TODO(kosi): Merge this with binary expression by just change table
    [SyntaxType.UnaryExpression]: (node, children) => {
      const [l] = node.params;

      if (node.value in unopTable) {
        const operator = unopTable[node.value];
        node.staticType = nativeType(l.staticType);

        const r = globalModule[nativeType(l.staticType)][operator](...children);

        // NOTE(kosi): This means this is just an expression statement, we should drop this value
        if (node.parent?.type === SyntaxType.Block) {
          return globalModule.drop(r);
        }

        return r;
      }

      invariant(false, `unknown unary operator used: ${node.value}`);
    },

    // See https://www.assemblyscript.org/types.html#type-rules for implicit conversion rules
    [SyntaxType.AssignmentStatement]: (node, children) => {
      const [l, r] = node.params;
      const lhs = lookup(currentScope!, l.value);

      invariant(!lhs?.immutable, 'cannot mutate immutable variables');

      // TODO(kosi): Abstract this out
      const lt = nativeType(l.staticType);
      const rt = nativeType(r.staticType);

      // Try integer promotion otherwise just raise an error
      let rExpr = children[1]!;

      if (lt !== rt) {
        const promotion = tryPromote(rt, lt, globalModule);

        if (!!promotion) {
          rExpr = promotion(rExpr);
        } else {
          invariant(
            false,
            'left-hand side type does not match right-hand side type'
          );
        }
      }

      if (!!lhs?.localId) {
        return globalModule.local.set(lhs.localId, rExpr);
      } else {
        return globalModule.global.set(prefixModuleMember(l.value), rExpr);
      }
    },

    [SyntaxType.ReturnStatement]: (node, children) => {
      let expr = children[0];
      if (!expr) {
        return;
      }

      if (
        nativeType(currentRetValue!) !== nativeType(node.params[0].staticType)
      ) {
        const promotion = tryPromote(
          node.params[0].staticType,
          currentRetValue!,
          globalModule
        );

        if (!!promotion) {
          expr = promotion(expr);
        } else {
          invariant(
            false,
            `expect return value of ${currentRetValue}, instead got: ${node.params[0].staticType}`
          );
        }
      }

      return globalModule.return(expr);
    },

    [SyntaxType.IfStatement]: (node, children) => {
      return globalModule.if(
        children[0]!,
        children[1]!,
        children[2] || undefined
      );
    },

    [SyntaxType.BoolLiteral]: (node, _) =>
      globalModule.i32.const(node.value ? 1 : 0),

    [SyntaxType.Identifier]: (node, _) => {
      // If there is no current scope, then identifiers are being used outside of a function
      if (!currentScope) {
        return;
      }

      const sym = lookup(currentScope!, node.value)!;
      node.staticType = sym.staticType;

      // If the identifier is on the left hand side dont call get
      if (!!node.lhs) {
        return;
      }

      invariant(sym != null, `variable '${node.value}' does not exist`);

      return sym.global
        ? globalModule.global.get(
            prefixModuleMember(node.value),
            binaryenType(sym.staticType)
          )
        : globalModule.local.get(sym.localId!, binaryenType(sym.staticType));
    },
  };

  transform(traverseMap)(ast);

  invariant(
    !!globalModule.validate(),
    'WebAssembly module could not validate, code generation was poor.'
  );

  // globalModule.optimize();

  return globalModule;
}
