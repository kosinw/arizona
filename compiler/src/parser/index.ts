import * as moo from 'moo';
import { tokens } from './tokens';

export interface Lexer {
  save(): any;
  reset(chunk: any, info: any): any;
  next(): any;
  formatError(token: any): any;
  has(name: any): any;
  current: any;
  lines: string[];
  readonly line: any;
  readonly col: any;
}

export function makeLexer(): Lexer {
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
      // It's a cruel and unusual punishment to implement comments with nearly
      let token = mooLexer.next();
      // Drop all comment tokens found
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
