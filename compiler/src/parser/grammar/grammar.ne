# Grammar for Arizona programming langauge

@preprocessor typescript
@builtin "whitespace.ne"

@include "./types.ne"
@include "./control-flow.ne"
@include "./use.ne"

@{%
import { lexer } from './lexer';
import { SyntaxType } from './types';
import makeSyntaxTypes, { extendNode, flatten, nth, nil, compose, drop } from './syntax';

const syntax = makeSyntaxTypes();
const ll = lexer();
%}

@lexer ll

Program ->
      _                                 {% compose(syntax.node(SyntaxType.RootNode, { value: 'root' }), flatten) %}
    | _ TopLevelDeclarations _          {% compose(syntax.node(SyntaxType.RootNode, { value: 'root' }), flatten) %}

TopLevelDeclarations ->
    TopLevelDeclaration                             {% flatten %}
    | TopLevelDeclaration _ TopLevelDeclarations    {% compose(drop, flatten, flatten) %}

TopLevelDeclaration ->
      FunctionDeclaration                       {% id %}
    | GlobalVariableDeclaration                 {% id %}
    | GlobalImmutableDeclaration                {% id %}
    | Export                                    {% id %}
    | UseFunctionDeclaration                    {% id %}

Export ->
      EXPORT __ GlobalImmutableDeclaration            {% syntax.node(SyntaxType.Export, { value: 'export' }) %}
    | EXPORT __ FunctionDeclaration                   {% syntax.node(SyntaxType.Export, { value: 'export' }) %}
    | EXPORT __ GlobalVariableDeclaration             {% syntax.node(SyntaxType.Export, { value: 'export' }) %}

Block ->
      LCB _ RCB                                   {% syntax.node(SyntaxType.Block) %}
    | LCB _ Statements _ RCB                      {% compose(syntax.node(SyntaxType.Block), flatten) %}

Statements ->
      Statement                                                         {% drop %}
    | Statement _ Statements                                            {% flatten %}

FunctionDeclaration ->
      FN __ Identifier _ FunctionParameters  _ Block                    {% syntax.voidfn %}
    | FN __ Identifier _ FunctionParameters _ FunctionResult _ Block    {% syntax.fn %}

FunctionHeaderDeclaration ->
      FN __ Identifier _ TypeParameters                    {% syntax.fnheader %}
    | FN __ Identifier _ TypeParameters _ FunctionResult   {% syntax.fnheader %}

FunctionResult ->
    RARROW _ Type                                           {% compose(syntax.result, drop) %}

FunctionParameters ->
      LP _ RP                                               {% syntax.node(SyntaxType.FunctionParameters) %}
    | LP _ Parameters _ RP                                  {% compose(syntax.node(SyntaxType.FunctionParameters), flatten, flatten) %}

TypeParameters ->
      LP _ RP                                               {% syntax.node(SyntaxType.FunctionParameters) %}
    | LP _ Types _ RP                                       {% compose(syntax.node(SyntaxType.FunctionParameters), flatten, flatten) %}

Parameters ->
      NameAndType                                           {% id %}
    | NameAndType _ COMMA _ Parameters                      {% flatten %}

Types ->
      Type                                           {% id %}
    | Type _ COMMA _ Types                           {% flatten %}

AnonymousBlock ->
    Block                                                 {% id %}

Statement ->
      ExpressionStatement                                 {% id %}
    | AssignmentStatement                                 {% id %}
    | ReturnStatement                                     {% id %}
    | VariableDeclaration                                 {% id %}
    | ImmutableDeclaration                                {% id %}
    | IfStatement                                         {% id %}
    | AnonymousBlock                                      {% id %}
    | ForStatement                                        {% id %}
    | WhileStatement                                      {% id %}
    | Break                                               {% id %}
    | Continue                                            {% id %}

GlobalVariableDeclaration ->
      LET _ NameAndType _ EQUALS _ Atom TERMINATOR              {% syntax.declaration(SyntaxType.GlobalVariableDeclaration) %}
    | LET _ NameAndType TERMINATOR                              {% syntax.declaration(SyntaxType.GlobalVariableDeclaration) %}

GlobalImmutableDeclaration ->
      CONST _ NameAndType _ EQUALS _ Atom TERMINATOR            {% syntax.declaration(SyntaxType.GlobalImmutableDeclaration) %}

VariableDeclaration ->
      LET _ NameAndType _ EQUALS _ Expression TERMINATOR        {% syntax.declaration(SyntaxType.VariableDeclaration) %}
    | LET _ NameAndType TERMINATOR                              {% syntax.declaration(SyntaxType.VariableDeclaration) %}

ImmutableDeclaration ->
      CONST _ NameAndType _ EQUALS _ Expression TERMINATOR      {% syntax.declaration(SyntaxType.ImmutableDeclaration) %}

NameAndType -> Identifier _ COLON _ DeclType                    {% syntax.node(SyntaxType.Pair) %}

DeclType -> Type                                                {% compose(extendNode({ type: SyntaxType.DeclType }), nth(0)) %}

ReturnStatement ->
      RETURN __ Expression TERMINATOR                           {% syntax.return %}
    | RETURN TERMINATOR                                         {% syntax.return %}

AssignmentStatement -> _Assignment TERMINATOR                   {% id %}

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
    | BoolLiteral               {% id %}

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
RP          -> ")"     {% nil %}
LCB         -> "{"     {% nil %}
RCB         -> "}"     {% nil %}
RANGLE      -> ">"     {% nil %}
DOT         -> "."     {% nil %}
COMMA       -> ","     {% nil %}
LANGLE      -> "<"     {% nil %}
TERMINATOR  -> _ ";"   {% nil %}
EQUALS      -> "="     {% nil %}
COLON       -> ":"     {% nil %}
RARROW      -> "->"    {% nil %}

# Keywords
FN        -> "fn"                   {% nil %}
VOID      -> "void"                 {% nil %}
LET       -> "let"                  {% nil %}
CONST     -> "const"                {% nil %}
EXPORT    -> "export"               {% nil %}
USE       -> "use"                  {% nil %}
FROM      -> "from"                 {% nil %}
RETURN    -> "return"               {% nil %}
TYPE      -> "type"                 {% nil %}
IF        -> "if"                   {% nil %}
ELSE      -> "else"                 {% nil %}
FOR       -> "for"                  {% nil %}
WHILE     -> "while"                {% nil %}
BREAK     -> "break"                {% nil %}
CONTINUE  -> "continue"             {% nil %}