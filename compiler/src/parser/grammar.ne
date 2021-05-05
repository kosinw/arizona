# Grammar for Arizona programming langauge

@preprocessor typescript 
@builtin "whitespace.ne"

@{%
    import * as moo from 'moo';
    import { makeLexer } from '.';
    import factory, { flatten, nth, nil, compose, drop } from './syntax';

    const lexer = makeLexer();
    const syntax = factory(lexer);
%}

@lexer lexer

Expression -> AssignmentExpression  {% id %}

AssignmentExpression -> Subscript {% id %}

Call ->
    Subscript _ LP _ ArgumentList _ RP          {% compose(syntax.call, flatten) %}
    | Subscript _ LP _ RP                       {% syntax.call %}
    | Subscript                                 {% id %}

ArgumentList ->
    Expression                                  {% id %}
    | NativeType                                {% id %}
    | Expression _ COMMA _ ArgumentList         {% flatten %}

Subscript ->
    Access LSB _ Expression _ RSB Subscript     {% syntax.subscript %}
    | Access LSB _ Expression _ RSB             {% syntax.subscript %}
    | Access                                    {% id %}

Access ->
    Access DOT Identifier           {% compose(syntax.access, drop) %}
    | NativeType DOT Identifier     {% compose(syntax.access, drop) %}
    | Grouping                      {% id %}

Grouping ->
    LP _ Expression _ RP            {% nth(2) %}
    | Atom                          {% id %}

Atom -> 
    Identifier                  {% id %}
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
LSB       -> "["     {% nil %}
RSB       -> "]"     {% nil %}
LP        -> "("     {% nil %}
RP        -> ")"     {% nil %}
DOT       -> "."     {% nil %}
COMMA     -> ","     {% nil %}

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