import { SyntaxNode } from './parser/types';

export interface CompileResult {
  text: string;
  buffer: Uint8Array;
  ast: SyntaxNode;
}
