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
    value?: string;
    staticType?: string | null;
    meta?: { [x: string]: any };
    params: Syn[];
}