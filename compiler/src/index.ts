import { setDebugInfo, setOptimizeLevel, setShrinkLevel } from 'binaryen';
import invariant from 'invariant';
import { generate } from './codegen';
import { parse } from './parser';
import { generateSymbolTable } from './semantics/index';
import { CompileOptions, CompileResult } from './types';

export { CompileOptions, CompileResult };

// TODO(kosi): Maybe pass in compile options?
/**
 * Compiles an Arizona program into WebAssembly.
 * @param source Arizona source code
 */
export function compile(
  source: string,
  options: Partial<CompileOptions> = { binaryen: { noValidate: false } }
): CompileResult {
  const ast = parse(source);
  const symtab = generateSymbolTable(ast);

  if (!!options.optimization?.debug) {
    setDebugInfo(true);
  }

  if (!!options.optimization?.level) {
    setOptimizeLevel(options.optimization.level);
  }

  if (!!options.optimization?.shrinkLevel) {
    setShrinkLevel(options.optimization.shrinkLevel);
  }
  
  const wasm = generate(ast, symtab);

  invariant(
    !!options.binaryen?.noValidate ? true : !!wasm.validate(),
    'WebAssembly module could not validate, code generation was poor.'
  );

  if (!!options.optimization?.level) {
    wasm.optimize();
  }

  let buffer = wasm.emitBinary();

  if (!!options.debugging?.sourceMap) {
    buffer = wasm.emitBinary(options.debugging.sourceMap).binary;
  }

  return {
    text: wasm.emitText(),
    buffer,
    ast,
  };
}
