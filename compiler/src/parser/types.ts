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
  LoopStatement = 'LoopStatement',
  BreakStatement = 'BreakStatement',
  ContinueStatement = 'ContinueStatement',
  Noop = 'Noop',
  UseFunctionDeclaration = 'UseFunctionDeclaration',
  FunctionHeaderDeclaration = 'FunctionHeaderDeclaration',
  TypecastExpression = 'TypecastExpression'
}

export enum SyntaxNativeType {
  I32 = 'i32',
  F32 = 'f32',
  I64 = 'i64',
  F64 = 'f64',
  Bool = 'bool',
  Void = 'void',
}

export type SyntaxStaticType = SyntaxNativeType | string;

export interface SyntaxNode {
  type: SyntaxType;
  value: any;
  staticType: SyntaxStaticType;
  params: SyntaxNode[];
  parent?: SyntaxNode;
  lhs?: boolean;
}
