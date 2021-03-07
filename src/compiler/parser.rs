use crate::{
    common::span::*, compiler::ast, compiler::error::*, compiler::lexer::*, compiler::token::*,
};

pub type PResult<T> = Result<T, ParserError>;

struct Parser {
    tokens: Tokens,
    cursor: usize,
    errors: ParserErrors,
}

impl Parser {
    fn new(tokens: Tokens) -> Parser {
        Parser {
            tokens,
            cursor: 0,
            errors: vec![],
        }
    }

    // NOTE: This will EXPLODE if self.tokens is empty
    fn peek(&mut self) -> PResult<Spanned<Token>> {
        match self.tokens.get(self.cursor) {
            Some(token) => Ok(token.clone()),
            None => Err(ParserError::new(
                ParserErrorKind::UnexpectedEOF,
                &self.tokens.last().unwrap().span,
            )),
        }
    }

    fn peek_token(&mut self) -> PResult<Token> {
        let Spanned { item: tok, .. } = self.peek()?;
        Ok(tok)
    }

    fn expect(&mut self, expected: &Token) -> PResult<Span> {
        let Spanned { item: got, span } = self.peek()?;

        if *expected != got {
            return Err(ParserError::new(
                ParserErrorKind::UnexpectedToken {
                    expected: expected.clone(),
                    got: got.clone(),
                },
                &span,
            ));
        }

        self.cursor += 1;

        Ok(span)
    }

    fn end_expr(&mut self) -> PResult<Span> {
        let Spanned { item: got, span } = self.peek()?;

        match got {
            Token::End | Token::Semicolon | Token::Newline | Token::Comma => {
                self.cursor += 1;
                Ok(span)
            }
            _ => Err(ParserError::new(
                ParserErrorKind::ExpectedEndExpr(got),
                &span,
            )),
        }
    }

    fn parse_expr(&mut self) -> PResult<ast::Expr> {
        match self.peek_token()? {
            Token::Let => self.parse_let_expr(),
            Token::IntegerLiteral(_) => self.parse_int_literal_expr(),
            _ => todo!(),
        }
    }

    fn parse_let_expr(&mut self) -> PResult<ast::Expr> {
        let first = self.expect(&Token::Let)?;

        let lhs = self.parse_ident()?;

        let rhs = if self.peek_token()? == Token::Assign {
            self.expect(&Token::Assign)?;

            Some(Box::new(self.parse_expr()?))
        } else {
            None
        };

        let last = self.end_expr()?;

        // TODO: Add types stuff
        Ok(ast::Expr {
            span: Span::combine(&first, &last),
            item: ast::ExprKind::LetExpr(lhs, None, rhs),
        })
    }

    // TODO: This will just not work out in the end
    fn parse_int_literal_expr(&mut self) -> PResult<ast::Expr> {
        let Spanned { item: token, span } = self.peek()?;

        match &token {
            Token::IntegerLiteral(i) => {
                self.cursor += 1;
                Ok(ast::Expr {
                    item: ast::ExprKind::LiteralExpr(ast::Literal::Integer(*i)),
                    span,
                })
            }
            t => Err(ParserError::new(
                ParserErrorKind::ExpectedInteger(t.clone()),
                &span,
            )),
        }
    }

    fn parse_ident(&mut self) -> PResult<Spanned<String>> {
        let Spanned { span, item: tok } = self.peek()?;

        let s = match tok {
            Token::Identifier(s) => s,
            t => {
                return Err(ParserError::new(
                    ParserErrorKind::ExpectedIdentifier(t),
                    &span,
                ))
            }
        };

        self.cursor += 1;

        Ok(Spanned { item: s, span })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::common::source::*;
    use insta::assert_debug_snapshot;

    #[test]
    fn local_decl() {
        let source = Source::pathless("let i;");
        let tokens = lex(&source).unwrap();

        let mut parser = Parser::new(tokens);
        let let_stmt = parser.parse_expr();

        assert_debug_snapshot!(let_stmt);
    }

    #[test]
    fn local_int_init() {
        let source = Source::pathless("let i = 13 ");
        let tokens = lex(&source).unwrap();

        let mut parser = Parser::new(tokens);
        let let_stmt = parser.parse_expr();

        assert_debug_snapshot!(let_stmt);
    }
}
