import { SyntaxStaticType } from '../parser/types';

export interface Symbol {
  immutable: boolean;
  staticType: SyntaxStaticType;
}

export interface SymbolTable {
  symbols: Record<string, Symbol>;
  parentTable?: SymbolTable;
}

export enum GlobalSymbolTablePortationType {
  Global = 'Global',
  Function = 'Function',
}

export interface GlobalSymbolTable extends SymbolTable {
  exports: Record<string, GlobalSymbolTablePortationType>;
  imports: Record<string, GlobalSymbolTablePortationType>;
  functions: Record<string, FunctionSymbolTable>;
}

export interface BlockSymbolTable extends SymbolTable {
  blocks: BlockSymbolTable[];
}

export interface FunctionSymbolTable extends BlockSymbolTable {
  locals: Record<string, Symbol>;
  returnValue?: Symbol;
}
