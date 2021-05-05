import { describe, it, expect } from '@jest/globals';

import grammar from '../grammar';
import { Parser, Grammar } from 'nearley';
import * as util from 'util';

const depthless = (d: any) => util.inspect(d, { depth: null });

describe('parser tests', () => {
  it('basic parsing (arithmetic expressions)', () => {
    const src = `a = (1 + 3 - 4 * 18 ^ 2) == (8 / 2 % 13);`;

    const parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src);

    expect(parser.results).toMatchSnapshot();
  });

  it('more parsing (assignments statements)', () => {
    const src1 = `a += 15;`;
    const src2 = `a = 23;`;
    const src3 = `a -= 15;`;

    let parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src1);
    expect(parser.results).toMatchSnapshot();

    parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src2);
    expect(parser.results).toMatchSnapshot();

    parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src3);
    expect(parser.results).toMatchSnapshot();
  });

  it('even more parsing (statements)', () => {
    const src = `return    ;`;

    const parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src);

    console.log(parser.results.length);
    console.log(depthless(parser.results));
  });
});
