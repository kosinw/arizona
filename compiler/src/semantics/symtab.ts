import invariant from 'invariant';
import { SyntaxNativeType } from '../parser/types';

import {
  SymbolTable,
  Symbol,
  FunctionSymbolTable,
  GlobalSymbolTable,
  BlockSymbolTable,
  GlobalSymbolTablePortationType,
} from './types';

export function globalsymtab(
  partial: Partial<GlobalSymbolTable>
): GlobalSymbolTable {
  return {
    functions: partial.functions || {},
    symbols: partial.symbols || {},
    exports: partial.exports || {},
    imports: partial.imports || {},
  };
}

export function blocksymtab(
  partial: Partial<BlockSymbolTable>
): BlockSymbolTable {
  return {
    blocks: partial.blocks || [],
    symbols: partial.symbols || {},
    parentTable: partial.parentTable,
    lastVisitedBlock: partial.lastVisitedBlock || 0,
  };
}

export function fnsymtab(
  partial: Partial<FunctionSymbolTable>
): FunctionSymbolTable {
  return {
    blocks: partial.blocks || [],
    symbols: partial.symbols || {},
    locals: partial.locals || [],
    returnValue: partial.returnValue,
    parentTable: partial.parentTable,
    lastVisitedBlock: partial.lastVisitedBlock || 0,
  };
}

export function symb(partial: Partial<Symbol>): Symbol {
  return {
    immutable: partial.immutable || false,
    staticType: partial.staticType || SyntaxNativeType.Void,
    global: partial.global || false
  };
}

export function insert(table: SymbolTable, name: string, sym: Symbol): Symbol {
  invariant(!(name in table.symbols), 'cannot define same variable twice');

  return (table.symbols[name] = sym);
}

// NOTE(kosi): HOLY SHIT THIS IS THE HACKIEST SHIT EVER
// but the only thing we really care about isnt the name of local variables
// just how much there is so WebAssembly knows how much space is used for local vars.
//
// Probably the correct way to do this is to give the block a unique identifier
// and add that to the variable as a suffix?

export function addLocal(fn: FunctionSymbolTable, sym: Symbol): number {
  return fn.locals.push(sym) - 1;
}

export function addExport(
  glob: GlobalSymbolTable,
  name: string,
  type: GlobalSymbolTablePortationType
): GlobalSymbolTable {
  invariant(
    !(name in glob.exports),
    'cannot have two exports named the same thing'
  );

  glob.exports[name] = type;
  return glob;
}

export function addImport(
  glob: GlobalSymbolTable,
  name: string,
  type: GlobalSymbolTablePortationType
): GlobalSymbolTable {
  invariant(
    !(name in glob.imports),
    'cannot have two exports named the same thing'
  );

  glob.imports[name] = type;
  return glob;
}

export function enterFunction(
  parent: GlobalSymbolTable,
  name: string
): FunctionSymbolTable {
  invariant(!(name in parent.functions), 'cannot define same function twice');

  return (parent.functions[name] = fnsymtab({ parentTable: parent }));
}

export function exitScope(
  table: BlockSymbolTable | null
): BlockSymbolTable | null {
  if (!table) {
    return null;
  }

  if (!!table.parentTable && !table.parentTable.parentTable) {
    return null;
  }

  return !!table.parentTable ? (table.parentTable as BlockSymbolTable) : null;
}

export function enterBlock(parent: BlockSymbolTable): BlockSymbolTable {
  const tab = blocksymtab({ parentTable: parent });
  parent.blocks.push(tab);
  return tab;
}

export function lookup(table: SymbolTable, key: string): Symbol | null {
  if (key in table.symbols) {
    return table.symbols[key];
  }

  if (!table.parentTable) {
    return null;
  }

  return lookup(table.parentTable!, key);
}

export function lookupFunction(
  table: GlobalSymbolTable,
  key: string
): FunctionSymbolTable | null {
  if (key in table.functions) {
    return table.functions[key];
  }

  return null;
}

export function contains(table: SymbolTable, key: string): boolean {
  return lookup(table, key) !== null;
}
