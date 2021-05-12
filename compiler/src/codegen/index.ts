import {
  SyntaxNativeType,
  SyntaxNode,
  SyntaxStaticType,
  SyntaxType,
} from "../parser/types";
import binaryen from "binaryen";
import invariant from "invariant";
import { transform } from "../common/transform";
import { Nullable, TransformCallback, TransformMap } from "../common/types";
import {
  BlockSymbolTable,
  FunctionSymbolTable,
  GlobalSymbolTable,
  GlobalSymbolTablePortationType,
} from "../semantics/types";
import { exitScope, lookup, lookupFunction } from "../semantics/symtab";
import _ from "lodash";

const binopTable: Record<string, string> = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "div_u",
  "%": "rem_u",
  "<<": "shl",
  ">>": "shr_u",
  "^": "xor",
  "&": "and",
  "|": "or",
  "==": "eq",
  "!=": "ne",
  "<": "lt_u",
  ">": "gt_u",
  "<=": "le_u",
  ">=": "ge_u",
};

const unopTable: Record<string, string> = {
  "!": "eqz",
  "+": "abs",
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

let globalCounter = 0;
function getNextBlockId(): string {
  let a = globalCounter.toString();
  globalCounter++;
  return a.toString();
}

const typeConversionTable: Record<string, string> = {
  [`${SyntaxNativeType.I64}->${SyntaxNativeType.I32}`]: "i32.wrap",
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.I32}`]: "nop",
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.I32}`]: "i32.trunc_s.f32",
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.I32}`]: "i32.trunc_s.f64",

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.I64}`]: "nop",
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.I64}`]: "i64.extend_s",
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.I64}`]: "i64.trunc_s.f32",
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.I64}`]: "i64.trunc_s.f64",

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.F32}`]: "f32.convert_s.i64",
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.F32}`]: "f32.convert_s.i32",
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.F32}`]: "nop",
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.F32}`]: "f32.demote",

  [`${SyntaxNativeType.I64}->${SyntaxNativeType.F64}`]: "f64.convert_s.i64",
  [`${SyntaxNativeType.I32}->${SyntaxNativeType.F64}`]: "f64.convert_s.i32",
  [`${SyntaxNativeType.F32}->${SyntaxNativeType.F64}`]: "f64.promote",
  [`${SyntaxNativeType.F64}->${SyntaxNativeType.F64}`]: "nop",
};

function binaryenType(type: SyntaxStaticType): binaryen.Type {
  const t = nativeType(type)!;
  if (t in binaryen) {
    return binaryen[t];
  }
  return binaryen.none;
}

function typecast(
  from: SyntaxStaticType,
  to: SyntaxStaticType,
  mod: binaryen.Module
): ((x: binaryen.ExpressionRef) => binaryen.ExpressionRef) | null {
  const predicate = `${nativeType(from)}->${nativeType(to)}`;
  const cmd = typeConversionTable[predicate];

  if (cmd === "nop") {
    return null;
  }

  return _.get(mod, cmd);
}

function typecastToGreaterType(
  a: SyntaxStaticType,
  b: SyntaxStaticType,
  mod: binaryen.Module
): ((x: binaryen.ExpressionRef) => binaryen.ExpressionRef) | null {
  const an = nativeType(a);
  const bn = nativeType(b);

  if (nativeTypeRanking[nativeType(a)!] > nativeTypeRanking[nativeType(b)!]) {
    return typecast(b, a, mod);
  }

  return typecast(a, b, mod);
}

function greaterType(
  a: SyntaxStaticType,
  b: SyntaxStaticType
): SyntaxStaticType {
  if (nativeTypeRanking[nativeType(a)!] > nativeTypeRanking[nativeType(b)!]) {
    return a;
  }

  return b;
}

// TODO(kosi): No holds barred, convert anything without caring about integer promotion rules.
function tryPromote(
  from: SyntaxStaticType,
  to: SyntaxStaticType,
  mod: binaryen.Module
): Nullable<(x: binaryen.ExpressionRef) => binaryen.ExpressionRef> {
  return typecast(from, to, mod);
}

function nativeType(t: SyntaxStaticType): SyntaxNativeType | null {
  if (t in binaryen) {
    return t as SyntaxNativeType;
  } else if (t in typeTable) {
    return typeTable[t];
  }

  return null;
}

function prefixModuleMember(name: string): string {
  return "module/" + name;
}

function filterNull<T>(arr: Nullable<T>[]): T[] {
  return arr.filter((val) => val != null) as T[];
}

// all of this is so hacky and probably deserves to be burned in a fire
export function generate(
  ast: SyntaxNode,
  symtab: GlobalSymbolTable,
  memoryImport: boolean = false
): binaryen.Module {
  const mod = new binaryen.Module();

  let currentScope: Nullable<BlockSymbolTable> = null;
  let currentRetValue: Nullable<SyntaxStaticType> = null;
  const loopLabelStack: string[] = [];

  // @ts-ignore
  const emptyBlock = mod.block(null, []);

  mod.setMemory(0, -1, null, []);

  if (memoryImport) {
    mod.addMemoryImport("0", "env", "memory");
  }

  // @ts-ignore
  mod.addMemoryExport("0", "memory");

  const declareGlobalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const qualifiedName = prefixModuleMember(node.value);
    const globalEntry = lookup(symtab, node.value)!;
    const isMutable = !globalEntry.immutable;
    const t = binaryenType(globalEntry.staticType);

    // TODO(kosi): Abstract this out
    const lt = nativeType(globalEntry.staticType)!;
    const rt = nativeType(node.params[0].staticType)!;

    // Try integer promotion otherwise just raise an error
    let rexpr = children[0]!;

    if (lt !== rt) {
      const promotion = tryPromote(rt, lt, mod);

      if (!!promotion) {
        rexpr = promotion(rexpr);
      } else {
        invariant(
          false,
          "left-hand side type does not match right-hand side type"
        );
      }
    }

    return mod.addGlobal(qualifiedName, t, isMutable, rexpr);
  };

  const declareLocalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const localSymbol = lookup(currentScope!, node.value)!;
    // TODO(kosi): Abstract this out
    const lt = nativeType(localSymbol.staticType)!;
    const rt = nativeType(node.params[0].staticType)!;

    // Try integer promotion otherwise just raise an error
    let rExpr = children[0]!;

    if (lt !== rt) {
      const promotion = tryPromote(rt, lt, mod);

      if (!!promotion) {
        rExpr = promotion(rExpr);
      } else {
        invariant(
          false,
          "left-hand side type does not match right-hand side type"
        );
      }
    }

    return mod.local.set(localSymbol.localId!, rExpr);
  };

  const numberLiteral: TransformCallback<binaryen.Type> = (node, _chidlren) =>
    mod[nativeType(node.staticType)!].const(node.value);

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

        return mod.addFunction(
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
        invariant(currentScope != null, "current scope is null");
        currentScope = currentScope.blocks[currentScope.lastVisitedBlock++];
      },
      callback(node, children) {
        const stmts = filterNull(children);
        // @ts-ignore
        return mod.block(null, stmts);
      },
      post(node) {
        currentScope = exitScope(currentScope);
      },
    },

    [SyntaxType.LoopStatement]: {
      pre(_) {
        loopLabelStack.push("loop/" + getNextBlockId());
      },
      callback(_, children) {
        const labelName = loopLabelStack[loopLabelStack.length - 1];
        const [init, condition, block, afterthought] = children;
        const breakLabel = labelName + "/break";
        const continueLabel = labelName + "/continue";

        // 4th child is optional
        // @ts-ignore
        return mod.block(breakLabel, [
          init!,
          mod.loop(
            labelName,
            // @ts-ignore
            mod.block(continueLabel, [
              mod.br_if(breakLabel, mod.i32.eq(condition!, mod.i32.const(0))),
              block!,
              afterthought || mod.nop(),
              mod.br(labelName),
            ])
          ),
        ]);
      },
      post(_) {
        loopLabelStack.pop();
      },
    },

    [SyntaxType.BreakStatement]: (node, children) => {
      invariant(loopLabelStack.length > 0, "must be currently in a loop");
      const labelName = loopLabelStack[loopLabelStack.length - 1];
      return mod.br(labelName + "/break");
    },

    [SyntaxType.ContinueStatement]: (node, children) => {
      invariant(loopLabelStack.length > 0, "must be currently in a loop");
      const labelName = loopLabelStack[loopLabelStack.length - 1];
      return mod.br(labelName + "/continue");
    },

    [SyntaxType.FunctionCall]: (node, children) => {
      // TOOD(kosi): 1mil% hack to get independent study demo working
      if (node.value === "store16") {
        return mod.i32.store16(0, 0, children[0]!, children[1]!);
      }

      // TODO(kosi): This will 100% break with access types
      const fn = lookupFunction(symtab, node.value)!;
      const retType = nativeType(fn.returnValue?.staticType!)!;

      invariant(
        Object.values(fn.symbols).length === children.length,
        `number of arguments for function '${node.value}' is incorrect`
      );
      node.staticType = retType;

      return mod.call(
        prefixModuleMember(node.value),
        children.map((c) => c!),
        binaryenType(retType)
      );
    },

    [SyntaxType.Noop]: (node, children) => mod.nop(),

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
        return mod.addFunctionExport(
          prefixModuleMember(exportName),
          exportName
        );
      } else if (exportType === GlobalSymbolTablePortationType.Global) {
        invariant(
          symtab.symbols[exportName].immutable,
          "exported global variables must be immutable"
        );

        return mod.addGlobalExport(prefixModuleMember(exportName), exportName);
      }
    },

    [SyntaxType.UseFunctionDeclaration]: (node, _) => {
      const moduleName = node.params[0].value;
      const fnEntry = symtab.functions[moduleName];

      const internalName = prefixModuleMember(moduleName);

      // TODO(kosi): Add base module information to symbol table
      const externalModule = node.params[1].value;

      const procParamType = binaryen.createType(
        Object.values(fnEntry.symbols).map((sym) =>
          binaryenType(sym.staticType)
        )
      );

      const procReturnType = binaryenType(fnEntry.returnValue!.staticType);

      return mod.addFunctionImport(
        internalName,
        externalModule,
        moduleName,
        procParamType,
        procReturnType
      );
    },

    [SyntaxType.BinaryExpression]: (node, children) => {
      // TODO(kosi): Add a switch-case table here
      const [l, rhs] = node.params;
      if (node.value in binopTable) {
        let operator = binopTable[node.value];

        const type =
          node.value === "||" || node.value === "&&"
            ? nativeType("bool")!
            : nativeType(greaterType(l.staticType, rhs.staticType))!;

        // NOTE(kosi): Very big hack, but remove _s for floatingd types and add _u for unsigned types
        if (type.indexOf("f") !== -1) {
          operator = operator.replace("_s", "");
          operator = operator.replace("_u", "");
        } else if (type.indexOf("u") !== -1) {
          operator = operator.replace("_s", "_u");
        }

        node.staticType = type;

        let lexpr = children[0]!;
        let rexpr = children[1]!;

        if (l.staticType !== rhs.staticType) {
          const cast = typecastToGreaterType(l.staticType, rhs.staticType, mod);

          if (
            !!cast &&
            greaterType(l.staticType, rhs.staticType) === l.staticType
          ) {
            rexpr = cast(rexpr);
          } else if (!!cast) {
            lexpr = cast(lexpr);
          }
        }

        let r = mod[type][operator](lexpr, rexpr);

        // NOTE(kosi): This means this is just an expression statement, we should drop this value
        if (node.parent?.type === SyntaxType.Block) {
          return mod.drop(r);
        }

        return r;
      }

      invariant(false, `unknown binary operator used: ${node.value}`);
    },

    [SyntaxType.TypecastExpression]: (node, children) => {
      const cast = typecast(node.params[0].staticType, node.staticType, mod);

      return !!cast ? cast(children[0]!) : children[0]!;
    },

    // TODO(kosi): Merge this with binary expression by just change table
    [SyntaxType.UnaryExpression]: (node, children) => {
      const [l] = node.params;

      if (node.value in unopTable) {
        const operator = unopTable[node.value];
        node.staticType = nativeType(l.staticType)!;

        const r = mod[nativeType(l.staticType)!][operator](...children);

        // NOTE(kosi): This means this is just an expression statement, we should drop this value
        if (node.parent?.type === SyntaxType.Block) {
          return mod.drop(r);
        }

        return r;
      }

      invariant(false, `unknown unary operator used: ${node.value}`);
    },

    // See https://www.assemblyscript.org/types.html#type-rules for implicit conversion rules
    [SyntaxType.AssignmentStatement]: (node, children) => {
      const [l, r] = node.params;
      const lhs = lookup(currentScope!, l.value);

      invariant(!lhs?.immutable, "cannot mutate immutable variables");

      // TODO(kosi): Abstract this out
      const lt = nativeType(l.staticType)!;
      const rt = nativeType(r.staticType)!;

      // Try integer promotion otherwise just raise an error
      let rExpr = children[1]!;

      if (lt !== rt) {
        const promotion = tryPromote(rt, lt, mod);

        if (!!promotion) {
          rExpr = promotion(rExpr);
        } else {
          invariant(
            false,
            "left-hand side type does not match right-hand side type"
          );
        }
      }

      if (!!lhs?.localId) {
        return mod.local.set(lhs.localId, rExpr);
      } else {
        return mod.global.set(prefixModuleMember(l.value), rExpr);
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
          mod
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

      return mod.return(expr);
    },

    [SyntaxType.IfStatement]: (node, children) => {
      return mod.if(children[0]!, children[1]!, children[2] || undefined);
    },

    [SyntaxType.BoolLiteral]: (node, _) => mod.i32.const(node.value ? 1 : 0),

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
        ? mod.global.get(
            prefixModuleMember(node.value),
            binaryenType(sym.staticType)
          )
        : mod.local.get(sym.localId!, binaryenType(sym.staticType));
    },
  };

  transform(traverseMap)(ast);

  // globalModule.optimize();

  return mod;
}
