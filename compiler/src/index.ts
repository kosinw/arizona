import { generate } from './codegen';
import { parse } from './parser';
import { CompileResult } from './types';

// TODO(kosi): Maybe pass in compile options?
// TODO(kosi): Do post-order tree traversal to do typechecking
/**
 * Compiles an Arizona program into WebAssembly.
 * @param source Arizona source code
 */
export function compile(source: string): CompileResult {
  const ast = parse(source);
  const wasm = generate(ast);

  return {
    text: wasm.emitText(),
    buffer: wasm.emitBinary(),
    ast
  };
}
