import * as moo from 'moo';
import { SyntaxNativeType } from './types';

export const keywords = [
  'break',
  'if',
  'else',
  'use',
  'from',
  'export',
  'return',
  'const',
  'let',
  'for',
  'continue',
  'while',
  'fn',
  'type',
  'struct',
];

export const punctuators = [
  '+',
  '++',
  '-',
  '--',
  '>>',
  '<<',
  '>>=',
  '<<=',
  '=',
  '==',
  '+=',
  '-=',
  '=>',
  '<=',
  '>=',
  '!=',
  '%',
  '%=',
  '*',
  '*=',
  '/',
  '/=',
  '^',
  '^=',
  '&',
  '&=',
  '~',
  '|',
  '|=',
  '!',
  ':',
  '(',
  ')',
  '.',
  '{',
  '}',
  ',',
  '[',
  ']',
  ';',
  '>',
  '<',
  '?',
  '||',
  '&&',
  '{',
  '}',
  '->',
];

export const types = Object.values(SyntaxNativeType);

export const tokens: moo.Rules = {
  whitespace: { match: /\s+/, lineBreaks: true },
  comment: [
    { match: /\/\/.*?$/ },
    { match: /\/\*[^]*?\*\//, lineBreaks: true },
  ],
  float: { match: /[0-9]+\.[0-9]*/ },
  integer: [
    { match: /0[xX][0-9a-fA-F_]+/ },
    { match: /0[oO][0-7_]+/ },
    { match: /0[bB][01_]+/ },
    { match: /(?:[1-9][0-9_]*|0)/ },
  ],
  char: [
    { match: /'(?:\\['\\bnfrtv0]|[^'\\\n])'/, value: (x) => x.slice(1, -1) },
  ],
  string: [
    { match: /"(?:\\["\\rn]|[^"\\\n])*?"/, value: (x) => x.slice(1, -1) },
    { match: /'(?:\\['\\bfnrtv0]|[^'\\\n])*?'/, value: (x) => x.slice(1, -1) },
  ],
  bool: [{ match: /true|false/ }],
  identifier: {
    match: /[A-Za-z_][A-Za-z0-9_]*/,
    type: moo.keywords({ keyword: keywords, type: types }),
  },
  punctuator: punctuators,
};
