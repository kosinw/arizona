IfStatement ->
      IF _ Expression _ Block                  {% syntax.node(SyntaxType.IfStatement) %}
    | IF _ Expression _ Block _ ElseStatement  {% syntax.node(SyntaxType.IfStatement) %}

ElseStatement ->
      ELSE _ Block                             {% syntax.else %}
    | ELSE _ IfStatement                       {% syntax.else %}

ForStatement ->
      FOR _ _Assignment TERMINATOR _ Expression TERMINATOR _ _Assignment _ Block
                                              {% syntax.for %}
    | FOR _ LP _ _Assignment TERMINATOR _ Expression TERMINATOR _ _Assignment _ RP _ Block
                                              {% syntax.for %}
    | FOR _ VariableDeclaration _ Expression TERMINATOR _ _Assignment _ Block
                                              {% syntax.for %}
    | FOR _ LP _ VariableDeclaration _ Expression TERMINATOR _ _Assignment _ RP _ Block
                                              {% syntax.for %}

WhileStatement -> WHILE _ Expression _ Block  {% syntax.while %}

Break     -> BREAK TERMINATOR                  {% syntax.node(SyntaxType.BreakStatement) %}
Continue  -> CONTINUE TERMINATOR               {% syntax.node(SyntaxType.ContinueStatement) %}
