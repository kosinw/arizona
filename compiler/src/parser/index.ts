import { Grammar, Parser } from 'nearley';
import grammar from './grammar';
import invariant from 'invariant';
import { SyntaxNode } from './types';

export function parse(source: string): SyntaxNode {
  const parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(source);

  invariant(
    parser.results.length === 1,
    `Ambiguous syntax. Number of parser productions ${parser.results.length}.`
  );

  return parser.results[0];
}
