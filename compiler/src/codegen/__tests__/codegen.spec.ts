import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { parse } from '../../parser/';
import { generate } from '..';
import { GeneratorResult } from '../types';
import { generateSymbolTable } from '../../semantics/index';

const generateCode = (src: string): GeneratorResult => {
  const ast = parse(src);
  const symtab = generateSymbolTable(ast);
  return generate(ast, symtab);
};

describe('parser tests', () => {
  it('can parse a very complex program', () => {
    const src = dedent`
      export const baz: f32 = 12.24;

      export fn echo(a: i32, b: i32) -> f32 {
          let foo: i32 = 42;
          let bar: f32 = 5.6;

          {
            let foo: f32 = 65.67;
          }

          return bar;
      }
    `;

    const program = generateCode(src);

    console.log(program.emitText());
    // expect(parser.results.length).toEqual(1);
  });
});
