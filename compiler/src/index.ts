import * as syntax from './parser/syntax';

export interface CompileResult {
  text: string;
  buffer: Uint8Array;
  ast: syntax.Syn;
}

// TODO(kosi): Maybe pass in compile options?
/**
 * Compiles an Arizona program into WebAssembly.
 * @param source
 * @param options
 */
export function compile(source: string): CompileResult {
  throw 'unimplemented';
}
