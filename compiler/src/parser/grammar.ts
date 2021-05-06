// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var type: any;
declare var identifier: any;
declare var float: any;
declare var integer: any;
declare var string: any;
declare var char: any;
declare var bool: any;

import { lex } from '.';
import makeSyntaxTypes, { SyntaxType, extendNode, flatten, nth, nil, compose, drop } from './syntax';

const lexer = lex();
const syntax = makeSyntaxTypes();

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "_Type", "symbols": ["NativeType"], "postprocess": id},
    {"name": "_Type", "symbols": ["Identifier"], "postprocess": id},
    {"name": "Type", "symbols": ["_Type"], "postprocess": id},
    {"name": "IfStatement", "symbols": ["IF", "_", "Expression", "_", "Block"], "postprocess": syntax.node(SyntaxType.IfStatement)},
    {"name": "IfStatement", "symbols": ["IF", "_", "Expression", "_", "Block", "_", "ElseStatement"], "postprocess": syntax.node(SyntaxType.IfStatement)},
    {"name": "ElseStatement", "symbols": ["ELSE", "_", "Block"], "postprocess": syntax.node(SyntaxType.ElseStatement)},
    {"name": "ElseStatement", "symbols": ["ELSE", "_", "IfStatement"], "postprocess": syntax.node(SyntaxType.ElseStatement)},
    {"name": "ForStatement", "symbols": ["FOR", "_", "_Assignment", "TERMINATOR", "_", "Expression", "TERMINATOR", "_", "_Assignment", "_", "Block"], "postprocess": syntax.for},
    {"name": "WhileStatement", "symbols": ["WHILE", "_", "Expression", "_", "Block"], "postprocess": syntax.while},
    {"name": "Break", "symbols": ["BREAK", "TERMINATOR"], "postprocess": syntax.node(SyntaxType.BreakStatement)},
    {"name": "Continue", "symbols": ["CONTINUE", "TERMINATOR"], "postprocess": syntax.node(SyntaxType.ContinueStatement)},
    {"name": "UseFunctionDeclaration", "symbols": ["USE", "__", "FunctionHeaderDeclaration", "_", "FROM", "_", "StringLiteral", "TERMINATOR"], "postprocess": syntax.node(SyntaxType.UseFunctionDeclaration)},
    {"name": "Program", "symbols": ["_"], "postprocess": compose(syntax.node(SyntaxType.RootNode, { value: 'root' }), flatten)},
    {"name": "Program", "symbols": ["_", "TopLevelDeclarations", "_"], "postprocess": compose(syntax.node(SyntaxType.RootNode, { value: 'root' }), flatten)},
    {"name": "TopLevelDeclarations", "symbols": ["TopLevelDeclaration"], "postprocess": flatten},
    {"name": "TopLevelDeclarations", "symbols": ["TopLevelDeclaration", "_", "TopLevelDeclarations"], "postprocess": compose(drop, flatten, flatten)},
    {"name": "TopLevelDeclaration", "symbols": ["FunctionDeclaration"], "postprocess": id},
    {"name": "TopLevelDeclaration", "symbols": ["GlobalVariableDeclaration"], "postprocess": id},
    {"name": "TopLevelDeclaration", "symbols": ["GlobalImmutableDeclaration"], "postprocess": id},
    {"name": "TopLevelDeclaration", "symbols": ["Export"], "postprocess": id},
    {"name": "TopLevelDeclaration", "symbols": ["UseFunctionDeclaration"], "postprocess": id},
    {"name": "Export", "symbols": ["EXPORT", "__", "GlobalImmutableDeclaration"], "postprocess": syntax.node(SyntaxType.Export, { value: 'export' })},
    {"name": "Export", "symbols": ["EXPORT", "__", "FunctionDeclaration"], "postprocess": syntax.node(SyntaxType.Export, { value: 'export' })},
    {"name": "Export", "symbols": ["EXPORT", "__", "GlobalVariableDeclaration"], "postprocess": syntax.node(SyntaxType.Export, { value: 'export' })},
    {"name": "Block", "symbols": ["LCB", "_", "RCB"], "postprocess": syntax.node(SyntaxType.Block)},
    {"name": "Block", "symbols": ["LCB", "_", "Statements", "_", "RCB"], "postprocess": compose(syntax.node(SyntaxType.Block), flatten)},
    {"name": "Statements", "symbols": ["Statement"], "postprocess": drop},
    {"name": "Statements", "symbols": ["Statement", "_", "Statements"], "postprocess": flatten},
    {"name": "FunctionDeclaration", "symbols": ["FN", "__", "Identifier", "_", "FunctionParameters", "_", "Block"], "postprocess": syntax.voidfn},
    {"name": "FunctionDeclaration", "symbols": ["FN", "__", "Identifier", "_", "FunctionParameters", "_", "FunctionResult", "_", "Block"], "postprocess": syntax.fn},
    {"name": "FunctionHeaderDeclaration", "symbols": ["FN", "__", "Identifier", "_", "TypeParameters"], "postprocess": syntax.fnheader},
    {"name": "FunctionHeaderDeclaration", "symbols": ["FN", "__", "Identifier", "_", "TypeParameters", "_", "FunctionResult"], "postprocess": syntax.fnheader},
    {"name": "FunctionResult", "symbols": ["RARROW", "_", "Type"], "postprocess": compose(syntax.result, drop)},
    {"name": "FunctionParameters", "symbols": ["LP", "_", "RP"], "postprocess": syntax.node(SyntaxType.FunctionParameters)},
    {"name": "FunctionParameters", "symbols": ["LP", "_", "Parameters", "_", "RP"], "postprocess": compose(syntax.node(SyntaxType.FunctionParameters), flatten, flatten)},
    {"name": "TypeParameters", "symbols": ["LP", "_", "RP"], "postprocess": syntax.node(SyntaxType.FunctionParameters)},
    {"name": "TypeParameters", "symbols": ["LP", "_", "Types", "_", "RP"], "postprocess": compose(syntax.node(SyntaxType.FunctionParameters), flatten, flatten)},
    {"name": "Parameters", "symbols": ["NameAndType"], "postprocess": id},
    {"name": "Parameters", "symbols": ["NameAndType", "_", "COMMA", "_", "Parameters"], "postprocess": flatten},
    {"name": "Types", "symbols": ["Type"], "postprocess": id},
    {"name": "Types", "symbols": ["Type", "_", "COMMA", "_", "Types"], "postprocess": flatten},
    {"name": "AnonymousBlock", "symbols": ["Block"], "postprocess": id},
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["AssignmentStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ReturnStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["VariableDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["ImmutableDeclaration"], "postprocess": id},
    {"name": "Statement", "symbols": ["IfStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["AnonymousBlock"], "postprocess": id},
    {"name": "Statement", "symbols": ["ForStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["WhileStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["Break"], "postprocess": id},
    {"name": "Statement", "symbols": ["Continue"], "postprocess": id},
    {"name": "GlobalVariableDeclaration", "symbols": ["LET", "_", "NameAndType", "_", "EQUALS", "_", "Atom", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.GlobalVariableDeclaration)},
    {"name": "GlobalVariableDeclaration", "symbols": ["LET", "_", "NameAndType", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.GlobalVariableDeclaration)},
    {"name": "GlobalImmutableDeclaration", "symbols": ["CONST", "_", "NameAndType", "_", "EQUALS", "_", "Atom", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.GlobalImmutableDeclaration)},
    {"name": "VariableDeclaration", "symbols": ["LET", "_", "NameAndType", "_", "EQUALS", "_", "Expression", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.VariableDeclaration)},
    {"name": "VariableDeclaration", "symbols": ["LET", "_", "NameAndType", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.VariableDeclaration)},
    {"name": "ImmutableDeclaration", "symbols": ["CONST", "_", "NameAndType", "_", "EQUALS", "_", "Expression", "TERMINATOR"], "postprocess": syntax.declaration(SyntaxType.ImmutableDeclaration)},
    {"name": "NameAndType", "symbols": ["Identifier", "_", "COLON", "_", "DeclType"], "postprocess": syntax.node(SyntaxType.Pair)},
    {"name": "DeclType", "symbols": ["Type"], "postprocess": compose(extendNode({ type: SyntaxType.DeclType }), nth(0))},
    {"name": "ReturnStatement", "symbols": ["RETURN", "__", "Expression", "TERMINATOR"], "postprocess": syntax.return},
    {"name": "ReturnStatement", "symbols": ["RETURN", "TERMINATOR"], "postprocess": syntax.return},
    {"name": "AssignmentStatement", "symbols": ["_Assignment", "TERMINATOR"], "postprocess": id},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"+="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"-="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"/="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"*="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "_Assignment", "symbols": ["Subscript", "_", {"literal":"%="}, "_", "Expression"], "postprocess": syntax.assignment},
    {"name": "ExpressionStatement", "symbols": ["Expression", "TERMINATOR"], "postprocess": id},
    {"name": "Expression", "symbols": ["Binary"], "postprocess": id},
    {"name": "Binary", "symbols": ["Logical"], "postprocess": id},
    {"name": "Logical", "symbols": ["Logical", "_", {"literal":"||"}, "_", "Bitwise"], "postprocess": syntax.binary},
    {"name": "Logical", "symbols": ["Logical", "_", {"literal":"&&"}, "_", "Bitwise"], "postprocess": syntax.binary},
    {"name": "Logical", "symbols": ["Bitwise"], "postprocess": id},
    {"name": "Bitwise", "symbols": ["Bitwise", "_", {"literal":"|"}, "_", "Sum"], "postprocess": syntax.binary},
    {"name": "Bitwise", "symbols": ["Bitwise", "_", {"literal":"^"}, "_", "Sum"], "postprocess": syntax.binary},
    {"name": "Bitwise", "symbols": ["Bitwise", "_", {"literal":"&"}, "_", "Sum"], "postprocess": syntax.binary},
    {"name": "Bitwise", "symbols": ["Equality"], "postprocess": id},
    {"name": "Equality", "symbols": ["Equality", "_", {"literal":"=="}, "_", "Comparison"], "postprocess": syntax.binary},
    {"name": "Equality", "symbols": ["Equality", "_", {"literal":"!="}, "_", "Comparison"], "postprocess": syntax.binary},
    {"name": "Equality", "symbols": ["Comparison"], "postprocess": id},
    {"name": "Comparison", "symbols": ["Comparison", "_", {"literal":"<"}, "_", "Shift"], "postprocess": syntax.binary},
    {"name": "Comparison", "symbols": ["Comparison", "_", {"literal":">"}, "_", "Shift"], "postprocess": syntax.binary},
    {"name": "Comparison", "symbols": ["Comparison", "_", {"literal":"<="}, "_", "Shift"], "postprocess": syntax.binary},
    {"name": "Comparison", "symbols": ["Comparison", "_", {"literal":">="}, "_", "Shift"], "postprocess": syntax.binary},
    {"name": "Comparison", "symbols": ["Shift"], "postprocess": id},
    {"name": "Shift", "symbols": ["Shift", "_", {"literal":">>"}, "_", "Sum"], "postprocess": syntax.binary},
    {"name": "Shift", "symbols": ["Shift", "_", {"literal":"<<"}, "_", "Sum"], "postprocess": syntax.binary},
    {"name": "Shift", "symbols": ["Sum"], "postprocess": id},
    {"name": "Sum", "symbols": ["Sum", "_", {"literal":"+"}, "_", "Product"], "postprocess": syntax.binary},
    {"name": "Sum", "symbols": ["Sum", "_", {"literal":"-"}, "_", "Product"], "postprocess": syntax.binary},
    {"name": "Sum", "symbols": ["Product"], "postprocess": id},
    {"name": "Product", "symbols": ["Product", "_", {"literal":"*"}, "_", "Unary"], "postprocess": syntax.binary},
    {"name": "Product", "symbols": ["Product", "_", {"literal":"/"}, "_", "Unary"], "postprocess": syntax.binary},
    {"name": "Product", "symbols": ["Product", "_", {"literal":"%"}, "_", "Unary"], "postprocess": syntax.binary},
    {"name": "Product", "symbols": ["Unary"], "postprocess": id},
    {"name": "Unary", "symbols": [{"literal":"!"}, "Call"], "postprocess": syntax.unary},
    {"name": "Unary", "symbols": [{"literal":"~"}, "Call"], "postprocess": syntax.unary},
    {"name": "Unary", "symbols": [{"literal":"!"}, "Call"], "postprocess": syntax.unary},
    {"name": "Unary", "symbols": [{"literal":"+"}, "Call"], "postprocess": syntax.unary},
    {"name": "Unary", "symbols": ["Call"], "postprocess": id},
    {"name": "Call", "symbols": ["Subscript", "_", "LP", "_", "ArgumentList", "_", "RP"], "postprocess": compose(syntax.call, flatten)},
    {"name": "Call", "symbols": ["Subscript", "_", "LP", "_", "RP"], "postprocess": syntax.call},
    {"name": "Call", "symbols": ["Subscript"], "postprocess": id},
    {"name": "ArgumentList", "symbols": ["Expression"], "postprocess": id},
    {"name": "ArgumentList", "symbols": ["NativeType"], "postprocess": id},
    {"name": "ArgumentList", "symbols": ["Expression", "_", "COMMA", "_", "ArgumentList"], "postprocess": flatten},
    {"name": "Subscript", "symbols": ["Access", "LSB", "_", "Expression", "_", "RSB", "Subscript"], "postprocess": syntax.subscript},
    {"name": "Subscript", "symbols": ["Access", "LSB", "_", "Expression", "_", "RSB"], "postprocess": syntax.subscript},
    {"name": "Subscript", "symbols": ["Access"], "postprocess": id},
    {"name": "Access", "symbols": ["Access", "DOT", "Identifier"], "postprocess": compose(syntax.access, drop)},
    {"name": "Access", "symbols": ["NativeType", "DOT", "Identifier"], "postprocess": compose(syntax.access, drop)},
    {"name": "Access", "symbols": ["Grouping"], "postprocess": id},
    {"name": "Grouping", "symbols": ["LP", "_", "Expression", "_", "RP"], "postprocess": nth(2)},
    {"name": "Grouping", "symbols": ["Atom"], "postprocess": id},
    {"name": "Atom", "symbols": ["Identifier"], "postprocess": id},
    {"name": "Atom", "symbols": ["StringLiteral"], "postprocess": id},
    {"name": "Atom", "symbols": ["CharLiteral"], "postprocess": id},
    {"name": "Atom", "symbols": ["FloatLiteral"], "postprocess": id},
    {"name": "Atom", "symbols": ["IntegerLiteral"], "postprocess": id},
    {"name": "Atom", "symbols": ["BoolLiteral"], "postprocess": id},
    {"name": "NativeType", "symbols": [(lexer.has("type") ? {type: "type"} : type)], "postprocess": syntax.type},
    {"name": "Identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": syntax.identifier},
    {"name": "FloatLiteral", "symbols": [(lexer.has("float") ? {type: "float"} : float)], "postprocess": syntax.float},
    {"name": "IntegerLiteral", "symbols": [(lexer.has("integer") ? {type: "integer"} : integer)], "postprocess": syntax.integer},
    {"name": "StringLiteral", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": syntax.string},
    {"name": "CharLiteral", "symbols": [(lexer.has("char") ? {type: "char"} : char)], "postprocess": syntax.char},
    {"name": "BoolLiteral", "symbols": [(lexer.has("bool") ? {type: "bool"} : bool)], "postprocess": syntax.bool},
    {"name": "LSB", "symbols": [{"literal":"["}], "postprocess": nil},
    {"name": "RSB", "symbols": [{"literal":"]"}], "postprocess": nil},
    {"name": "LP", "symbols": [{"literal":"("}], "postprocess": nil},
    {"name": "RP", "symbols": [{"literal":")"}], "postprocess": nil},
    {"name": "LCB", "symbols": [{"literal":"{"}], "postprocess": nil},
    {"name": "RCB", "symbols": [{"literal":"}"}], "postprocess": nil},
    {"name": "RANGLE", "symbols": [{"literal":">"}], "postprocess": nil},
    {"name": "DOT", "symbols": [{"literal":"."}], "postprocess": nil},
    {"name": "COMMA", "symbols": [{"literal":","}], "postprocess": nil},
    {"name": "LANGLE", "symbols": [{"literal":"<"}], "postprocess": nil},
    {"name": "TERMINATOR", "symbols": ["_", {"literal":";"}], "postprocess": nil},
    {"name": "EQUALS", "symbols": [{"literal":"="}], "postprocess": nil},
    {"name": "COLON", "symbols": [{"literal":":"}], "postprocess": nil},
    {"name": "RARROW", "symbols": [{"literal":"->"}], "postprocess": nil},
    {"name": "FN", "symbols": [{"literal":"fn"}], "postprocess": nil},
    {"name": "VOID", "symbols": [{"literal":"void"}], "postprocess": nil},
    {"name": "LET", "symbols": [{"literal":"let"}], "postprocess": nil},
    {"name": "CONST", "symbols": [{"literal":"const"}], "postprocess": nil},
    {"name": "EXPORT", "symbols": [{"literal":"export"}], "postprocess": nil},
    {"name": "USE", "symbols": [{"literal":"use"}], "postprocess": nil},
    {"name": "FROM", "symbols": [{"literal":"from"}], "postprocess": nil},
    {"name": "RETURN", "symbols": [{"literal":"return"}], "postprocess": nil},
    {"name": "TYPE", "symbols": [{"literal":"type"}], "postprocess": nil},
    {"name": "IF", "symbols": [{"literal":"if"}], "postprocess": nil},
    {"name": "ELSE", "symbols": [{"literal":"else"}], "postprocess": nil},
    {"name": "FOR", "symbols": [{"literal":"for"}], "postprocess": nil},
    {"name": "WHILE", "symbols": [{"literal":"while"}], "postprocess": nil},
    {"name": "BREAK", "symbols": [{"literal":"break"}], "postprocess": nil},
    {"name": "CONTINUE", "symbols": [{"literal":"continue"}], "postprocess": nil}
  ],
  ParserStart: "Program",
};

export default grammar;
