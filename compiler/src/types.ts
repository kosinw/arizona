import { SyntaxNode } from './parser/types';

export interface CompileResult {
  text: string;
  buffer: Uint8Array;
  ast: SyntaxNode;
}

export interface CompileOptions {
  optimization?: {
    level?: number;
    debug?: boolean;
    shrinkLevel?: number;
  };
  debugging?: {
    sourceMap?: string;
  };
  binaryen?: {
    noValidate?: boolean;
  }
}