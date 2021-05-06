UseFunctionDeclaration ->
    USE __ FunctionHeaderDeclaration _ FROM _ StringLiteral TERMINATOR  {% syntax.node(SyntaxType.UseFunctionDeclaration) %}
