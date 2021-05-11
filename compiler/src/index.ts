import { generate } from './codegen';
import { parse } from './parser';
import { generateSymbolTable } from './semantics/index';
import { CompileResult } from './types';

// TODO(kosi): Maybe pass in compile options?
/**
 * Compiles an Arizona program into WebAssembly.
 * @param source Arizona source code
 */
export function compile(
  source: string,
  optimize: boolean = false
): CompileResult {
  const ast = parse(source);
  const symtab = generateSymbolTable(ast);
  const wasm = generate(ast, symtab);

  if (optimize) {
    wasm.optimize();
  }

  return {
    text: wasm.emitText(),
    buffer: wasm.emitBinary(),
    ast,
  };
}
