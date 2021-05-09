import { SyntaxStaticType } from '../parser/types';

export interface Symbol {
  immutable: boolean;
  staticType: SyntaxStaticType;
  localId?: number;
  global?: boolean;
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
  lastVisitedBlock: number;
}

export interface FunctionSymbolTable extends BlockSymbolTable {
  locals: Symbol[];
  returnValue?: Symbol;
}
