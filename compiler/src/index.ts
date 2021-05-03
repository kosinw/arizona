// TODO(kosi): Add field for syntax tree.
export interface CompileResult {
  text: string;
  buffer: Uint8Array;
}

// TODO(kosi): Add linker stuff here.
export interface CompileOptions {
  filename: string;
}

// TODO(kosi): Maybe pass in compile options?
/**
 * Compiles an Arizona program into WebAssembly.
 * @param source 
 * @param options 
 */
export function compile(
  source: string,
  options?: CompileOptions
): CompileResult {
  const { filename = 'unknown.az' } = options || {};

  throw 'unimplemented';
}
