import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { parse } from '..';

describe('parser tests', () => {
  it('can parse a very complex program', () => {
    const src = dedent`
      use fn setPixel(x: i32, y: i32) -> f32 from "env";

      let i: i32 = 15;

      export fn echo(a: i32, c: f64) -> bool {
        if true {
           return true;
        } else {
          return false;
        }
      }
    `;
    
    const ast = parse(src);
    // expect(parser.results.length).toEqual(1);
    expect(ast).toMatchSnapshot();
  });
});
