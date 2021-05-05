import curry from 'curry';

export enum SyntaxType {
  Type = 'Type',
  Identifier = 'Identifier',
  IntegerLiteral = 'IntegerLiteral',
  FloatLiteral = 'FloatLiteral',
  StringLiteral = 'StringLiteral',
  CharLiteral = 'CharLiteral',
  BoolLiteral = 'BoolLiteral',
  AccessExpression = 'AccessExpression',
  ArraySubscript = 'ArraySubscript',
  FunctionCall = 'FunctionCall',
  UnaryExpression = 'UnaryExpression',
  BinaryExpression = 'BinaryExpression',
  AssignmentStatement = 'AssignmentStatement',
  ReturnStatement = 'ReturnStatement',
}

export interface Syn {
  type: SyntaxType;
  value: any;
  staticType: string | null;
  meta: { [x: string]: any };
  params: any[];
}

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

export default function factory() {
  const node = (type: SyntaxType, seed: any = {}) => (d: Syn[]): Syn => {
    const params = d.filter(nonEmpty);
    const { value = '', meta = {} } = seed;

    return {
      value,
      staticType: null,
      type,
      meta,
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
    const [id, field] = drop(d);

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

  const unary = ([opeartor, target]) => {
    return extendNode(
      {
        value: opeartor.value,
        params: [target],
      },
      node(SyntaxType.UnaryExpression)([opeartor, target])
    );
  };

  const binary = (d) => {
    const [lhs, operator, rhs] = drop(d);

    return node(SyntaxType.BinaryExpression, { value: operator.value })([
      lhs,
      rhs,
    ]);
  };

  const assignment = (d) => {
    const [lhs, operator, rhs] = drop(d);
    const { value }: { value: string } = operator;

    if (['-=', '+='].includes(value)) {
      const op = value[0];
      const b = binary([lhs, { value: op }, rhs]);
      return node(SyntaxType.AssignmentStatement, { value: '=' })([lhs, b]);
    }

    return node(SyntaxType.AssignmentStatement, { value })([lhs, rhs]);
  };

  const return_ = (d) => {
    return node(SyntaxType.ReturnStatement)(d);
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
    assignment,
    call,
    unary,
    binary,
    return: return_,
  };
}
