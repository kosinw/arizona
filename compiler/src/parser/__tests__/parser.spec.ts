import { describe, it, expect } from '@jest/globals';

import grammar from '../grammar';
import * as util from 'util';
import dedent from 'dedent';
import { Grammar, Parser } from 'nearley';

const depthless = (d: any) => util.inspect(d, { depth: null });

describe('parser tests', () => {
  it('can parse a very complex program', () => {
    const src = dedent`
      use fn setPixel(i32, i32) -> f32 from "env";

      let i: i32 = 15;

      export fn echo(a: i32, c: f64) -> i32 {
        while true {
          let j: i32 = 16;
          let k: f64 = 1.23456;
          let l: i32 = 0x3a;
          continue;
          break;
        }

        return (15 ^ 18) << 3 * 99;
      }
    `;
    
    const parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(src);
    const ast = parser.results[0];

    // expect(parser.results.length).toEqual(1);
    expect(ast).toMatchSnapshot();
  });
});
