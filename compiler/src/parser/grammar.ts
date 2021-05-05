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

import * as moo from 'moo';
import { makeLexer } from '.';
import makeSyntaxTypes, { flatten, nth, nil, compose, drop } from './syntax';

const lexer = makeLexer();
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
    {"name": "Statement", "symbols": ["ExpressionStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["AssignmentStatement"], "postprocess": id},
    {"name": "Statement", "symbols": ["ReturnStatement"], "postprocess": id},
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
    {"name": "RANGLE", "symbols": [{"literal":">"}], "postprocess": nil},
    {"name": "RP", "symbols": [{"literal":")"}], "postprocess": nil},
    {"name": "DOT", "symbols": [{"literal":"."}], "postprocess": nil},
    {"name": "COMMA", "symbols": [{"literal":","}], "postprocess": nil},
    {"name": "LANGLE", "symbols": [{"literal":"<"}], "postprocess": nil},
    {"name": "TERMINATOR", "symbols": ["_", {"literal":";"}], "postprocess": nil},
    {"name": "FN", "symbols": [{"literal":"fn"}], "postprocess": nil},
    {"name": "LET", "symbols": [{"literal":"let"}], "postprocess": nil},
    {"name": "CONST", "symbols": [{"literal":"const"}], "postprocess": nil},
    {"name": "EXPORT", "symbols": [{"literal":"export"}], "postprocess": nil},
    {"name": "IMPORT", "symbols": [{"literal":"import"}], "postprocess": nil},
    {"name": "FROM", "symbols": [{"literal":"from"}], "postprocess": nil},
    {"name": "RETURN", "symbols": [{"literal":"return"}], "postprocess": nil},
    {"name": "TYPE", "symbols": [{"literal":"type"}], "postprocess": nil},
    {"name": "IF", "symbols": [{"literal":"if"}], "postprocess": nil},
    {"name": "ELSE", "symbols": [{"literal":"else"}], "postprocess": nil},
    {"name": "FOR", "symbols": [{"literal":"for"}], "postprocess": nil},
    {"name": "WHILE", "symbols": [{"literal":"while"}], "postprocess": nil},
    {"name": "BREAK", "symbols": [{"literal":"break"}], "postprocess": nil}
  ],
  ParserStart: "Statement",
};

export default grammar;
