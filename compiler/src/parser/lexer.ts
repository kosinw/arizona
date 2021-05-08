import moo from 'moo';
import { tokens } from './tokens';
import { Lexer } from './types';

export function lexer(): Lexer {
  const mooLexer: any = moo.compile(tokens);

  return {
    current: null,
    lines: [],
    get line() {
      return mooLexer.line;
    },
    get col() {
      return mooLexer.col;
    },
    save() {
      return mooLexer.save();
    },
    reset(chunk, info) {
      this.lines = chunk!.split('\n');
      return mooLexer.reset(chunk, info);
    },
    next() {
      let token = mooLexer.next();

      while (token && token.type === 'comment') {
        token = mooLexer.next();
      }

      this.current = token;
      return this.current;
    },
    formatError(token) {
      return mooLexer.formatError(token);
    },
    has(name) {
      return mooLexer.has(name);
    },
  };
}
