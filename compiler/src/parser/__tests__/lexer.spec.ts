import { describe, it, expect } from '@jest/globals';
import dedent from 'dedent';
import { tokens } from '../tokens';
import * as moo from 'moo';

describe('lexer tests', () => {
  it('lexes some tokens', () => {
    const src = `
    // comment signle line
    /* hello
    */ world
    const let a = 32; // ''
    lf\ncr\rcrlf\r\n
    +-=_|
    `;

    const lexer = moo.compile(tokens);
    lexer.reset(src);

    expect(Array.from(lexer)).toMatchSnapshot();
  });

  it('lexes more tokens', () => {
    const src = dedent`
        fn factorial(n: i32) -> i32 {
            let j = 15;

            if (n == 1 || n == 0) {
                return 1;
            }

            return n * factorial(n-1)
        }
    `;

    const lexer = moo.compile(tokens);
    lexer.reset(src);

    expect(Array.from(lexer)).toMatchSnapshot();
  });
});
