# Grammar for Arizona programming langauge

@preprocessor typescript 
@builtin "whitespace.ne"

@{%
import * as moo from 'moo';
import { makeLexer } from '.';
import makeSyntaxTypes, { flatten, nth, nil, compose, drop } from './syntax';

const lexer = makeLexer();
const syntax = makeSyntaxTypes();
%}

@lexer lexer

Statement ->
      ExpressionStatement                                 {% id %}
    | AssignmentStatement                                 {% id %}
    | ReturnStatement                                     {% id %}

ReturnStatement -> 
      RETURN __ Expression TERMINATOR                           {% syntax.return %}
    | RETURN TERMINATOR                                         {% syntax.return %}

AssignmentStatement -> _Assignment TERMINATOR                  {% id %}

_Assignment ->
      Subscript _ "="  _ Expression                     {% syntax.assignment %}
    | Subscript _ "+=" _ Expression                     {% syntax.assignment %}
    | Subscript _ "-=" _ Expression                     {% syntax.assignment %}
    | Subscript _ "/=" _ Expression                     {% syntax.assignment %}
    | Subscript _ "*=" _ Expression                     {% syntax.assignment %}
    | Subscript _ "%=" _ Expression                     {% syntax.assignment %}

ExpressionStatement -> Expression TERMINATOR          {% id %}

Expression -> Binary                                    {% id %}

Binary -> Logical                   {% id %}

Logical ->
      Logical _ "||" _ Bitwise        {% syntax.binary %}
    | Logical _ "&&" _ Bitwise        {% syntax.binary %}
    | Bitwise                         {% id %}

Bitwise ->
      Bitwise _ "|" _ Sum             {% syntax.binary %}
    | Bitwise _ "^" _ Sum             {% syntax.binary %}
    | Bitwise _ "&" _ Sum             {% syntax.binary %}
    | Equality                        {% id %}

Equality ->
      Equality _ "==" _ Comparison      {% syntax.binary %}
    | Equality _ "!=" _ Comparison      {% syntax.binary %}
    | Comparison                        {% id %}

Comparison ->
      Comparison _ "<" _ Shift        {% syntax.binary %}
    | Comparison _ ">" _ Shift        {% syntax.binary %}
    | Comparison _ "<=" _ Shift       {% syntax.binary %}
    | Comparison _ ">=" _ Shift       {% syntax.binary %}
    | Shift                           {% id %}

Shift ->
      Shift _ ">>" _ Sum            {% syntax.binary %}
    | Shift _ "<<" _ Sum            {% syntax.binary %}
    | Sum                           {% id %}

Sum ->
      Sum _ "+" _ Product                       {% syntax.binary %}
    | Sum _ "-" _ Product                       {% syntax.binary %}
    | Product                                   {% id %}

Product ->
      Product _ "*" _ Unary                     {% syntax.binary %}
    | Product _ "/" _ Unary                     {% syntax.binary %}
    | Product _ "%" _ Unary                     {% syntax.binary %}
    | Unary                                     {% id %}

Unary ->
      "!" Call                                  {% syntax.unary %}
    | "~" Call                                  {% syntax.unary %}
    | "!" Call                                  {% syntax.unary %}
    | "+" Call                                  {% syntax.unary %}
    | Call                                      {% id %}

Call ->
      Subscript _ LP _ ArgumentList _ RP        {% compose(syntax.call, flatten) %}
    | Subscript _ LP _ RP                       {% syntax.call %}
    | Subscript                                 {% id %}
 
ArgumentList ->
      Expression                                {% id %}
    | NativeType                                {% id %}
    | Expression _ COMMA _ ArgumentList         {% flatten %}

Subscript ->
      Access LSB _ Expression _ RSB Subscript   {% syntax.subscript %}
    | Access LSB _ Expression _ RSB             {% syntax.subscript %}
    | Access                                    {% id %}

Access ->
      Access DOT Identifier         {% compose(syntax.access, drop) %}
    | NativeType DOT Identifier     {% compose(syntax.access, drop) %}
    | Grouping                      {% id %}

Grouping ->
      LP _ Expression _ RP            {% nth(2) %}
    | Atom                          {% id %}

Atom -> 
      Identifier                {% id %}
    | StringLiteral             {% id %}
    | CharLiteral               {% id %}
    | FloatLiteral              {% id %}
    | IntegerLiteral            {% id %}

NativeType      -> %type            {% syntax.type %}
Identifier      -> %identifier      {% syntax.identifier %}
FloatLiteral    -> %float           {% syntax.float %}
IntegerLiteral  -> %integer         {% syntax.integer %}
StringLiteral   -> %string          {% syntax.string %}
CharLiteral     -> %char            {% syntax.char %}
BoolLiteral     -> %bool            {% syntax.bool %}

# Punctuators
LSB         -> "["     {% nil %}
RSB         -> "]"     {% nil %}
LP          -> "("     {% nil %}
RANGLE      -> ">"     {% nil %}
RP          -> ")"     {% nil %}
DOT         -> "."     {% nil %}
COMMA       -> ","     {% nil %}
LANGLE      -> "<"     {% nil %}
TERMINATOR  -> _ ";"   {% nil %} 

# Keywords
FN        -> "fn"                   {% nil %}
LET       -> "let"                  {% nil %}
CONST     -> "const"                {% nil %}
EXPORT    -> "export"               {% nil %}
IMPORT    -> "import"               {% nil %}
FROM      -> "from"                 {% nil %}
RETURN    -> "return"               {% nil %}
TYPE      -> "type"                 {% nil %}
IF        -> "if"                   {% nil %}
ELSE      -> "else"                 {% nil %} 
FOR       -> "for"                  {% nil %}
WHILE     -> "while"                {% nil %}
BREAK     -> "break"                {% nil %}