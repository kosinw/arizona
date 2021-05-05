import { Lexer } from '.';
import curry from 'curry';

export enum SyntaxType {
  Type = 'type',
  Identifier = 'identifier',
  IntegerLiteral = 'integer',
  FloatLiteral = 'float',
  StringLiteral = 'string',
  CharLiteral = 'char',
  BoolLiteral = 'bool',
  AccessExpression = 'access',
  ArraySubscript = 'subscript',
  FunctionCall = 'call',
}

export interface Syn {
  type: SyntaxType;
  value: any;
  staticType: string | null;
  meta: { [x: string]: any };
  span: [any, any];
  params: any[];
}

const marker = (lexer: Lexer) => {
  const { col, line } = lexer;

  if (!lexer.lines.length) {
    return { col, line, sourceLine: '' };
  }

  return {
    col,
    line,
    sourceLine: lexer.lines[lexer.line - 1],
  };
};

export const nil = (d) => null;
export const nth = (n) => (d): Syn => d[n];
export const flatten = (d) =>
  d.reduce((acc, v) => {
    if (Array.isArray(v)) {
      return acc.concat(v);
    }

    return acc.concat(v);
  }, []);

export const nonEmpty = (d) => {
  return Array.isArray(d) ? !!d.length : d != null;
};

export const drop = (d): Syn[] => {
  return d.filter(nonEmpty);
};

export const add = (d) => `${d[0]}${d[1]}`;

const extendNode = curry(({ meta, ...options }: any, node: { meta: any }) => {
  return {
    ...node,
    meta: { ...node.meta, ...meta },
    ...options,
  };
});

export const compose = (...fns: any) =>
  fns.reduce((f: any, g: any) => (...args: any[]) => f(g(...args)));

export default function factory(lexer: Lexer) {
  const node = (type: SyntaxType, seed: any = {}) => (d: Syn[]): Syn => {
    const params = d.filter(nonEmpty);
    const { value = '', meta = {} } = seed;
    const start = marker(lexer);
    const end =
      params[params.length - 1] && params[params.length - 1].span
        ? params[params.length - 1].span[1]
        : { ...start, col: start.col + value.length };

    return {
      value,
      staticType: null,
      type,
      meta,
      span: [start, end],
      params,
    };
  };

  const string = (d): Syn => {
    return extendNode(
      {
        value: d[0].value,
        staticType: 'i32',
      },
      node(SyntaxType.StringLiteral)([])
    );
  };

  const char = (d): Syn => {
    return extendNode(
      {
        value: d[0].value,
        staticType: 'i32',
      },
      node(SyntaxType.CharLiteral)([])
    );
  };

  const float = (d): Syn => {
    return extendNode(
      {
        value: parseFloat(d[0].value.replaceAll('_', '')),
        staticType: 'f32',
      },
      node(SyntaxType.FloatLiteral)([])
    );
  };

  const bool = (d): Syn => {
    return extendNode(
      {
        value: d[0].value === 'true',
        staticType: 'bool',
      },
      node(SyntaxType.BoolLiteral)([])
    );
  };

  const integer = (d): Syn => {
    return extendNode(
      {
        value: parseInt(d[0].value.replaceAll('_', '')),
        staticType: 'i32',
      },
      node(SyntaxType.IntegerLiteral)([])
    );
  };

  const identifier = (d): Syn =>
    node(SyntaxType.Identifier, { value: d.join('') })([]);

  const type = (d): Syn => {
    return extendNode(
      {
        value: d[0].value,
        staticType: d[0].value,
        params: [],
      },
      node(SyntaxType.Type)(d)
    );
  };

  const access = (d): Syn => {
    return extendNode(
      {
        value: d[0].value + '.' + d[1].value,
      },
      node(SyntaxType.AccessExpression)(d)
    );
  };

  const subscript = (d): Syn => {
    const [id, field] = d.filter(nonEmpty);

    return extendNode(
      {
        value: id.value,
        params: [id, field],
      },
      node(SyntaxType.ArraySubscript)([id, field])
    );
  };

  const call = (d): Syn => {
    const [id, ...params] = drop(d);

    return extendNode(
      {
        value: id.value,
      },
      node(SyntaxType.FunctionCall)([id, ...params])
    );
  };

  return {
    string,
    char,
    bool,
    float,
    integer,
    identifier,
    type,
    access,
    subscript,
  };
}
