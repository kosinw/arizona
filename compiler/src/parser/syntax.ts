import curry from 'curry';
import { SyntaxNode, SyntaxType, SyntaxNativeType } from './types';

export const nil = (_d: SyntaxNode[]) => null;

export const nth = (n: number) => (d: SyntaxNode[]): SyntaxNode => d[n];

export const flatten = (d: SyntaxNode[][]) =>
  d.reduce((acc, v) => {
    if (Array.isArray(v)) {
      return acc.concat(v);
    }

    return acc.concat(v);
  }, []);

export const nonEmpty = (d: SyntaxNode): boolean => {
  return Array.isArray(d) ? !!d.length : d != null;
};

export const drop = (d: SyntaxNode[]): SyntaxNode[] => {
  return d.filter(nonEmpty);
};

export const extendNode = curry(({ ...options }: any, node: SyntaxNode) => {
  return {
    ...node,
    ...options,
  };
});

export const compose = (...fns: any) =>
  fns.reduce((f: any, g: any) => (...args: any[]) => f(g(...args)));

export default function factory() {
  const node = (type: SyntaxType, seed: Partial<SyntaxNode> = {}) => (
    d: SyntaxNode[]
  ): SyntaxNode => {
    const params = drop(d);
    const { value = SyntaxType[type] } = seed;

    return {
      value,
      staticType: SyntaxNativeType.Void,
      type,
      params,
    };
  };

  const string = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: d[0].value,
        staticType: SyntaxNativeType.I32,
      },
      node(SyntaxType.StringLiteral)([])
    );
  };

  const char = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: d[0].value,
        staticType: SyntaxNativeType.I32,
      },
      node(SyntaxType.CharLiteral)([])
    );
  };

  const float = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: parseFloat(d[0].value.replace('_', '')),
        staticType: SyntaxNativeType.F64,
      },
      node(SyntaxType.FloatLiteral)([])
    );
  };

  const bool = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: d[0].value === 'true',
        staticType: SyntaxNativeType.Bool,
      },
      node(SyntaxType.BoolLiteral)([])
    );
  };

  const integer = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: parseInt(d[0].value.replace('_', '')),
        staticType: SyntaxNativeType.I32,
      },
      node(SyntaxType.IntegerLiteral)([])
    );
  };

  const identifier = (d: SyntaxNode[]): SyntaxNode =>
    node(SyntaxType.Identifier, { value: d.join('') })([]);

  const type = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: d[0].value,
        staticType: d[0].value,
        params: [],
      },
      node(SyntaxType.Type)(d)
    );
  };

  const access = (d: SyntaxNode[]): SyntaxNode => {
    return extendNode(
      {
        value: d[0].value + '.' + d[1].value,
      },
      node(SyntaxType.AccessExpression)(d)
    );
  };

  const subscript = (d: SyntaxNode[]): SyntaxNode => {
    const [id, field] = drop(d);

    return extendNode(
      {
        value: id.value,
        params: [id, field],
      },
      node(SyntaxType.ArraySubscript)([id, field])
    );
  };

  const call = (d: SyntaxNode[]): SyntaxNode => {
    const [id, ...params] = drop(d);

    return extendNode(
      {
        value: id.value,
      },
      node(SyntaxType.FunctionCall)([...params])
    );
  };

  const unary = (d: SyntaxNode[]): SyntaxNode => {
    const [operator, target] = drop(d);

    if (operator.value === '+') {
      return target;
    } else if (operator.value === '~') {
      const lhs = target;
      const rhs = integer([
        extendNode({ value: '-1' }, node(SyntaxType.Noop)([])),
      ]);
      return binary([lhs, extendNode({ value: '^' }, operator), rhs]);
    } else if (operator.value === '-') {
      const lhs = integer([
        extendNode({ value: '0' }, node(SyntaxType.Noop)([])),
      ]);
      const rhs = target;
      return binary([lhs, extendNode({ value: '-' }, operator), rhs]);
    }

    return extendNode(
      {
        value: operator.value,
        params: [target],
      },
      node(SyntaxType.UnaryExpression)([operator, target])
    );
  };

  const binary = (d: SyntaxNode[]): SyntaxNode => {
    const [lhs, operator, rhs] = drop(d);

    if (operator.value === '||' || operator.value === '&&') {
      const condition = lhs;
      let primary: SyntaxNode = lhs;
      let alternative: SyntaxNode = rhs;

      if (operator.value === '&&') {
        primary = rhs;
        alternative = lhs;
      }

      return node(SyntaxType.IfStatement)([condition, primary, alternative]);
    }

    return node(SyntaxType.BinaryExpression, { value: operator.value })([
      lhs,
      rhs,
    ]);
  };

  const assignment = (d: SyntaxNode[]): SyntaxNode => {
    const [lhs, operator, rhs] = drop(d);
    const { value } = operator;

    if (value.length > 1) {
      const op = value.substring(0, value.length - 1);
      const b = binary([lhs, extendNode({ value: op }, operator), rhs]);
      return node(SyntaxType.AssignmentStatement, { value: '=' })([
        extendNode({ lhs: true }, lhs),
        b,
      ]);
    }

    return node(SyntaxType.AssignmentStatement, { value })([lhs, rhs]);
  };

  const declaration = curry(
    (type: SyntaxType, d: SyntaxNode[]): SyntaxNode => {
      const [pair, ...init] = drop(d);
      const [id, staticType] = pair.params;

      return extendNode(
        { value: id.value, staticType: staticType.value },
        node(type)(init)
      );
    }
  );

  const return_ = (d: SyntaxNode[]): SyntaxNode => {
    return node(SyntaxType.ReturnStatement)(d);
  };

  const voidfn = (d: SyntaxNode[]): SyntaxNode => {
    const params = drop(d);
    const [name, args, block] = params;

    const result = extendNode(
      { staticType: SyntaxNativeType.Void },
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

  const fn = (d: SyntaxNode[]): SyntaxNode => {
    const params = drop(d);
    const [name, args, result, block] = params;

    if (result.value === 'void') {
      return voidfn(d);
    }

    return extendNode(
      {
        value: name.value,
        params: [args, result, block],
      },
      node(SyntaxType.FunctionDeclaration)(params)
    );
  };

  const result = (d: SyntaxNode[]): SyntaxNode => {
    const [type] = drop(d);
    return extendNode(
      {
        staticType: type.value,
      },
      node(SyntaxType.FunctionResult)(d)
    );
  };

  const for_ = (d: SyntaxNode[]): SyntaxNode => {
    const [init, condition, afterthought, ...block] = drop(d);
    return node(SyntaxType.LoopStatement)([
      init,
      condition,
      ...block,
      afterthought,
    ]);
  };

  const else_ = (d: SyntaxNode[]): SyntaxNode => {
    const [alternative] = drop(d);
    return alternative;
  };

  const while_ = (d: SyntaxNode[]): SyntaxNode => {
    const noop = node(SyntaxType.Noop)([]);
    return node(SyntaxType.LoopStatement)([noop, ...d]);
  };

  const fnheader = (d: SyntaxNode[]): SyntaxNode => {
    const params = drop(d);
    const [name] = params;

    return extendNode(
      {
        value: name.value,
      },
      node(SyntaxType.FunctionHeaderDeclaration)(params)
    );
  };

  const typecast = (d: SyntaxNode[]): SyntaxNode => {
    const [type, expr] = drop(d);

    return extendNode(
      {
        value: type.value,
        staticType: type.staticType,
      },
      node(SyntaxType.TypecastExpression)([expr])
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
    typecast,
    else: else_,
    return: return_,
    for: for_,
    while: while_,
  };
}
