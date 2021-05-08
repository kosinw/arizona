import { SyntaxNode, SyntaxStaticType, SyntaxType } from '../parser/types';
import { GeneratorResult } from './types';
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
import { exitScope } from '../semantics/symtab';

function solicitBinaryenType(arizonaType: SyntaxStaticType): binaryen.Type {
  if (arizonaType in binaryen) {
    return binaryen[arizonaType];
  }
  return binaryen.none;
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
): GeneratorResult {
  const globalModule = new binaryen.Module();

  let currentScope: Nullable<BlockSymbolTable> = null;

  const emptyBlock = globalModule.block(null, []);

  const declareGlobalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const qualifiedName = prefixModuleMember(node.value);
    const globalEntry = symtab.symbols[node.value];
    const isMutable = !globalEntry.immutable;
    const expression = children[0]!;
    const binaryenType = solicitBinaryenType(globalEntry.staticType);

    return globalModule.addGlobal(
      qualifiedName,
      binaryenType,
      isMutable,
      expression
    );
  };

  const declareLocalVariable: TransformCallback<binaryen.Type> = (
    node,
    children
  ) => {
    const localSymbol = currentScope!.symbols[node.value];
    const expression = children[0]!;

    return globalModule.local.set(localSymbol.localId!, expression);
  };

  const numberLiteral: TransformCallback<binaryen.Type> = (node, _chidlren) =>
    globalModule[node.staticType].const(node.value);

  const traverseMap: TransformMap<binaryen.Type> = {
    [SyntaxType.FunctionDeclaration]: {
      pre(node) {
        currentScope = symtab.functions[node.value];
      },
      callback(node, _children) {
        const { value: procName } = node;
        const fnTable: FunctionSymbolTable = symtab.functions[procName];

        const procReturnType = solicitBinaryenType(
          fnTable.returnValue!.staticType
        );
        const procParamType = binaryen.createType(
          Object.values(fnTable.symbols).map((sym) =>
            solicitBinaryenType(sym.staticType)
          )
        );
        const numProcParams = Object.keys(fnTable.symbols).length;
        const procLocals = Object.values(
          fnTable.locals
            .slice(numProcParams)
            .map((sym) => solicitBinaryenType(sym.staticType))
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
      },
    },

    [SyntaxType.Block]: {
      pre(node) {
        invariant(currentScope != null, 'current scope is null');
        currentScope = currentScope.blocks[currentScope.lastVisitedBlock++];
      },
      callback(node, children) {
        const stmts = filterNull(children);

        return globalModule.block(null, stmts);
      },
      post(node) {
        currentScope = exitScope(currentScope);
      },
    },

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
        return globalModule.addGlobalExport(
          prefixModuleMember(exportName),
          exportName
        );
      }
    },

    [SyntaxType.BinaryExpression]: (node, children) => {
      // TODO(kosi): Add a switch-case table here
      const [lhs, rhs] = node.params;
      if (node.value === '+') {
        const lhsSym = currentScope?.symbols[lhs.value];
        const rhsSym = currentScope?.symbols[rhs.value];

        // NOTE(kosi): using type of lhs to add together two variables
        return globalModule[lhsSym?.staticType!].add(...children);
      }

      invariant(false, `unknown binary operator used: ${node.value}`);
    },

    [SyntaxType.ReturnStatement]: (_, children) => {
      const expr = children[0];
      if (!expr) {
        return;
      }
      return globalModule.return(expr);
    },

    [SyntaxType.Identifier]: (node, _) => {
      // If there is no current scope, then identifiers are being used outside of a function
      if (!currentScope) {
        return;
      }
      const sym = currentScope.symbols[node.value];
      return globalModule.local.get(
        sym.localId!,
        solicitBinaryenType(sym.staticType)
      );
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
