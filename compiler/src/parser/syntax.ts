import curry from 'curry';

export enum SyntaxType {
  Type = 'Type',
  DeclType = 'DeclType',
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
  ImmutableDeclaration = 'ImmutableDeclaration',
  VariableDeclaration = 'VariableDeclaration',
  GlobalImmutableDeclaration = 'GlobalImmutableDeclaration',
  GlobalVariableDeclaration = 'GlobalVariableDeclaration',
  Pair = 'Pair',
  RootNode = 'RootNode',
  FunctionResult = 'FunctionResult',
  FunctionDeclaration = 'FunctionDeclaration',
  FunctionParameters = 'FunctionParameters',
  Block = 'Block',
  Export = 'Export',
  IfStatement = 'IfStatement',
  ElseStatement = 'ElseStatement',
  LoopStatement = 'LoopStatement',
  BreakStatement = 'BreakStatement',
  ContinueStatement = 'ContinueStatement',
  Noop = 'Noop',
  UseFunctionDeclaration = 'UseFunctionDeclaration',
  FunctionHeaderDeclaration = 'FunctionHeaderDeclaration',
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

export const extendNode = curry(
  ({ meta, ...options }: any, node: { meta: any }) => {
    return {
      ...node,
      meta: { ...node.meta, ...meta },
      ...options,
    };
  }
);

export const compose = (...fns: any) =>
  fns.reduce((f: any, g: any) => (...args: any[]) => f(g(...args)));

export default function factory() {
  const node = (type: SyntaxType, seed: any = {}) => (d: Syn[]): Syn => {
    const params = drop(d);
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

  const unary = (d) => {
    const [operator, target] = drop(d);
    return extendNode(
      {
        value: operator.value,
        params: [target],
      },
      node(SyntaxType.UnaryExpression)([operator, target])
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

  const declaration = curry((type: SyntaxType, d) => {
    const [pair, ...init] = drop(d);
    const [id, staticType] = pair.params;

    return extendNode(
      { value: id.value, staticType: staticType.value },
      node(type)(init)
    );
  });

  const return_ = (d) => {
    return node(SyntaxType.ReturnStatement)(d);
  };

  const voidfn = (d) => {
    const params = drop(d);
    const [name, args, block] = params;

    const result = extendNode(
      { staticType: null },
      node(SyntaxType.FunctionResult)([])
    );

    return extendNode(
      {
        value: name.value,
        params: [args, result, block],
      },
      node(SyntaxType.FunctionDeclaration)(params)
    );
  };

  const fn = (d) => {
    const params = drop(d);
    const [name, _, result] = params;

    if (result.value === 'void') {
      return voidfn(d);
    }

    return extendNode(
      {
        value: name.value,
      },
      node(SyntaxType.FunctionDeclaration)(params)
    );
  };

  const result = (d) => {
    const [type] = drop(d);
    return extendNode(
      {
        staticType: type.value,
      },
      node(SyntaxType.FunctionResult)(d)
    );
  };

  const for_ = (d) => {
    const [init, condition, afterthought, ...block] = drop(d);
    return node(SyntaxType.LoopStatement)([
      init,
      condition,
      ...block,
      afterthought,
    ]);
  };

  const while_ = (d) => {
    const noop = node(SyntaxType.Noop)([]);
    return node(SyntaxType.LoopStatement)([noop, ...d]);
  };

  const fnheader = (d) => {
    const params = drop(d);
    const [name] = params;

    return extendNode(
      {
        value: name.value,
      },
      node(SyntaxType.FunctionHeaderDeclaration)(params)
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
    assignment,
    declaration,
    call,
    unary,
    binary,
    node,
    result,
    voidfn,
    fn,
    fnheader,
    return: return_,
    for: for_,
    while: while_,
  };
}
