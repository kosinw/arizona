import * as syntax from './parser/syntax';

export interface CompileResult {
  text: string;
  buffer: Uint8Array;
  ast: syntax.Syn;
}
