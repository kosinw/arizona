import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { parse } from '../../parser/';
import { generate } from '..';
import { generateSymbolTable } from '../../semantics/index';
import binaryen from 'binaryen';

const generateCode = (src: string): binaryen.Module => {
  const ast = parse(src);
  const symtab = generateSymbolTable(ast);
  return generate(ast, symtab);
};

describe('codegen tests', () => {
  it('can generate a very complex program', () => {
    const src = dedent`
      use fn console_log(x: i32) -> void from 'env';

      export fn fibonacci(n: i32) -> i32 {
        if (n <= 0) {
          console_log(n);
          return <i32>n;
        } else {
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      }
    `;

    const program = generateCode(src);

    console.log(program.emitText());

    expect(program.validate()).toBeTruthy();
  });
});
