import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { parse } from '../../parser/';
import { generate } from '..';
import { GeneratorResult } from '../types';

const parseThenGenerate = (src: string): GeneratorResult => {
    return generate(parse(src));
}

describe('parser tests', () => {
  it('can parse a very complex program', () => {
    const src = dedent`
      export fn echo(a: i32, b: i32) -> i32 {
          let foo: i32 = 42;
      }
    `;
    
    const program = parseThenGenerate(src);

    console.log(program.emitText());
    // expect(parser.results.length).toEqual(1);
  });
});
