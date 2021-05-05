import { describe, it, expect } from '@jest/globals';

import grammar from '../grammar';
import { Parser, Grammar } from 'nearley';
import * as util from 'util';

describe('parser tests', () => {
  it('basic parsing (arithmetic expressions)', () => {
    const src = `(chungus.suffering[0]())`;

    const parser = new Parser(Grammar.fromCompiled(grammar));

    parser.feed(src);

    console.log(util.inspect(parser.results, { depth: 5 }));
  });
});
