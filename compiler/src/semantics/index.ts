import {
  Symbol,
  FunctionSymbolTable,
  GlobalSymbolTable,
  BlockSymbolTable,
  GlobalSymbolTablePortationType,
} from './types';
import {
  insert,
  symb,
  globalsymtab,
  enterFunction,
  exitScope,
  enterBlock,
  addLocal,
  addExport,
  addImport,
} from './symtab';
import { SyntaxNode, SyntaxType, SyntaxNativeType } from '../parser/types';
import invariant from 'invariant';
import { TraverseMap } from '../common/types';
import { traverse } from '../common/traverse';

// TODO(kosi): Add a crap-ton of invariants to make sure symbols are being generated properly or whatever
export function generateSymbolTable(syntaxTree: SyntaxNode): GlobalSymbolTable {
  const globalSymbolTable: GlobalSymbolTable = globalsymtab({});
  let currentFunction: FunctionSymbolTable | null = null;
  let currentBlock: BlockSymbolTable | null = null;

  const traverseTable: TraverseMap = {
    [SyntaxType.GlobalVariableDeclaration]: (node: SyntaxNode, _) => {
      invariant(
        node.staticType != SyntaxNativeType.Void,
        'global variable decorations should have a definite static type'
      );
      const sym: Symbol = symb({
        immutable: false,
        staticType: node.staticType,
      });
      const name = node.value;
      insert(globalSymbolTable, name, sym);
    },

    [SyntaxType.GlobalImmutableDeclaration]: (node: SyntaxNode, _) => {
      invariant(
        node.staticType != SyntaxNativeType.Void,
        'global variable decorations should have a definite static type'
      );
      const sym: Symbol = symb({
        immutable: true,
        staticType: node.staticType,
      });
      const name = node.value;
      insert(globalSymbolTable, name, sym);
    },

    [SyntaxType.Export]: (node: SyntaxNode) => {
      let type =
        node.params[0].type === SyntaxType.FunctionDeclaration ||
        node.params[0].type === SyntaxType.FunctionHeaderDeclaration
          ? GlobalSymbolTablePortationType.Function
          : GlobalSymbolTablePortationType.Global;

      addExport(globalSymbolTable, node.params[0].value, type);
    },

    [SyntaxType.UseFunctionDeclaration]: (node: SyntaxNode) => {
      let type =
        node.params[0].type === SyntaxType.FunctionDeclaration ||
        node.params[0].type === SyntaxType.FunctionHeaderDeclaration
          ? GlobalSymbolTablePortationType.Function
          : GlobalSymbolTablePortationType.Global;

      addImport(globalSymbolTable, node.params[0].value, type);
    },

    [SyntaxType.FunctionDeclaration]: (node: SyntaxNode, walk) => {
      const name = node.value;
      currentFunction = enterFunction(globalSymbolTable, name);
      node.params.forEach(walk!);
      currentFunction = null;
      currentBlock = null;
    },

    [SyntaxType.FunctionHeaderDeclaration]: (node: SyntaxNode, walk) => {
      const name = node.value;
      currentFunction = enterFunction(globalSymbolTable, name);
      node.params.forEach(walk!);
      currentFunction = null;
      currentBlock = null;
    },

    [SyntaxType.FunctionParameters]: (node: SyntaxNode, _) => {
      const pairs = node.params;
      for (let pair of pairs) {
        const [{ value: name }, rhs] = pair.params;
        const sym: Symbol = symb({
          immutable: true,
          staticType: rhs.staticType,
        });
        const localId = addLocal(currentFunction!, sym);
        const s = insert(currentFunction!, name, sym);
        s.localId = localId;
      }
    },

    [SyntaxType.FunctionResult]: (node: SyntaxNode, _) => {
      currentFunction!.returnValue = {
        staticType: node.staticType,
        immutable: true,
      };
    },

    [SyntaxType.Block]: (node: SyntaxNode, walk) => {
      const table = !!currentBlock ? currentBlock : currentFunction;
      currentBlock = enterBlock(table!);
      node.params.forEach(walk!);
      currentBlock = exitScope(currentBlock);
    },

    [SyntaxType.VariableDeclaration]: (node: SyntaxNode) => {
      invariant(
        currentFunction != null,
        'cannot define local variables outside of function'
      );
      invariant(
        currentBlock != null,
        'cannot define local variables outside of block'
      );

      const { value: name } = node;
      const sym: Symbol = symb({
        immutable: false,
        staticType: node.staticType,
      });
      const localId = addLocal(currentFunction, sym);
      const s = insert(currentBlock!, name, sym);
      s.localId = localId;
    },

    [SyntaxType.ImmutableDeclaration]: (node: SyntaxNode) => {
      invariant(
        currentFunction != null,
        'cannot define local variables outside of function'
      );
      invariant(
        currentBlock != null,
        'cannot define local variables outside of block'
      );

      const { value: name } = node;
      const sym: Symbol = symb({
        immutable: false,
        staticType: node.staticType,
      });
      const localId = addLocal(currentFunction, sym);
      const s = insert(currentBlock!, name, sym);
      s.localId = localId;
    },
  };

  traverse(traverseTable)(syntaxTree);

  return globalSymbolTable;
}
