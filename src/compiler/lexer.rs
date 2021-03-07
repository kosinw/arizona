use crate::{
    common::{source::Source, span::Span, span::Spanned},
    compiler::{
        error::{LexerError, LexerErrors},
        token::Token,
    },
};

use std::{collections::HashMap, rc::Rc};

struct Lexer {
    // NOTE: should this be a normal borrow, rather than a reference counted one?
    source: Rc<Source>,
    cursor: usize,
    errors: LexerErrors,
}

pub type Tokens = Vec<Spanned<Token>>;

lazy_static! {
    static ref KEYWORDS: HashMap<String, Token> = hashmap! {
        String::from("let")    => Token::Let,
        String::from("fn")     => Token::Fn,
        String::from("return") => Token::Return,
        String::from("if")     => Token::If,
        String::from("else")   => Token::Else,
        String::from("while")  => Token::While,
        String::from("for")    => Token::For
    };
}

pub type LResult<T> = Result<T, LexerErrors>;

pub fn lex(source: &Rc<Source>) -> LResult<Tokens> {
    let mut lexer = Lexer::new(source);
    lexer.all()
}

impl Lexer {
    fn new(source: &Rc<Source>) -> Lexer {
        Lexer {
            source: Rc::clone(source),
            cursor: 0,
            errors: vec![],
        }
    }

    fn all(&mut self) -> LResult<Tokens> {
        let mut tokens: Tokens = Vec::new();

        loop {
            let token = self.advance();

            tokens.push(token.clone());

            if token.item == Token::End {
                break;
            }
        }

        if !self.errors.is_empty() {
            return Err(self.errors.clone());
        }

        Ok(tokens)
    }

    fn remaining(&self) -> &str {
        &self.source.contents[self.cursor..]
    }

    fn current(&self) -> Option<char> {
        self.remaining().chars().next()
    }

    fn peek(&self) -> Option<char> {
        self.remaining().chars().skip(1).next()
    }

    fn strip_whitespace(&mut self) {
        let mut len = 0;

        for c in self.remaining().chars() {
            if !c.is_whitespace() || c == '\n' {
                break;
            }

            len += c.len_utf8();
        }

        self.cursor += len;
    }

    fn strip_line_comment(&mut self) {
        self.expect('/');
        self.expect('/');

        let mut len = 0;

        for c in self.remaining().chars() {
            if c == '\n' {
                break;
            }

            len += c.len_utf8();
        }

        self.cursor += len;
    }

    // TODO: Implement multiline comments
    fn strip_multiline_comment(&mut self) {
        todo!()
    }

    fn strip_comments(&mut self) {
        if self.current() == Some('/') {
            match self.peek() {
                Some('/') => self.strip_line_comment(),
                Some('*') => self.strip_multiline_comment(),
                _ => {}
            }
        }
    }

    fn consume(&mut self) {
        if self.cursor >= self.source.contents.len() {
            return;
        }

        let mut len = 0;
        
        for c in self.remaining().chars().take(1) {
            len += c.len_utf8();
        }

        self.cursor += len;
    }

    fn consume_n_minus_one(&mut self, n: usize) {
        if self.cursor + n > self.source.contents.len() {
           return;
        }

        let mut len = 0;

        for c in self.remaining().chars().take(n - 1) {
            len += c.len_utf8();
        }

        self.cursor += len;
    }

    fn expect(&mut self, ch: char) -> bool {
        if self.current() == Some(ch) {
            self.consume();
            true
        } else {
            false
        }
    }

    fn is_alpha(ch: char) -> bool {
        ch.is_ascii_alphabetic() || ch == '_'
    }

    fn is_numeric(ch: char) -> bool {
        ch.is_ascii_digit()
    }

    fn lookup_keyword(ident: String) -> Token {
        if let Some(keyword) = KEYWORDS.get(&ident) {
            keyword.clone()
        } else {
            Token::Identifier(ident)
        }
    }

    fn is_alphanumeric(ch: char) -> bool {
        Lexer::is_alpha(ch) || Lexer::is_numeric(ch)
    }

    fn read_string_literal(&mut self) -> Option<String> {
        let mut buf = String::new();

        self.consume();

        loop {
            let ch = match self.current() {
                Some('"') => break,
                Some('\\') => self.read_escaped_char(),
                Some(ch) => Some(ch),
                _ => None, // EOF
            };

            if let Some(ch) = ch {
                buf.push(ch);
            } else {
                self.errors.push(LexerError::new(
                    "unexpected EOF while scanning string literal",
                    &Span::point(&self.source, self.cursor)
                ));

                break;
            }

            self.consume();
        }

        if self.current() == Some('"') {
            Some(buf)
        } else {
            // Hit a syntax error
            None
        }
    }

    fn read_escaped_char(&mut self) -> Option<char> {
        self.consume();

        match self.current() {
            Some('t') => Some('\t'),
            Some('n') => Some('\n'),
            Some('f') => Some('\x0C'),
            Some('r') => Some('\r'),
            Some('v') => Some('\x0B'),
            Some(ch) => Some(ch),
            _ => None,
        }
    }

    fn read_char_literal(&mut self) -> Option<char> {
        self.consume();

        let value = if self.current() == Some('\\') {
            self.read_escaped_char()
        } else {
            self.current()
        };

        self.consume();

        if self.current() == Some('\'') {
            value
        } else {
            if value == Some('\'') {
                self.errors.push(LexerError::new(
                    "cannot have empty char literal",
                    &Span::point(&self.source, self.cursor)
                ));
                return None;
            }

            let got = match self.current() {
                Some(ch) => format!("`{}`", ch),
                None => String::from("EOF")
            };

            self.errors.push(LexerError::new(
                &format!("expected `'` at end of char literal, instead got {}", got),
                &Span::point(&self.source, self.cursor)
            ));

            None
        }
    }

    fn read_identifier(&mut self) -> String {
        let mut len = 0;
        let mut buffer = String::new();

        for ch in self.remaining().chars() {
            if !Lexer::is_alphanumeric(ch) {
                break;
            }

            buffer.push(ch);
            len += ch.len_utf8();
        }

        self.consume_n_minus_one(len);

        buffer
    }

    fn read_decimal_literal(&mut self) -> i64 {
        let mut len = 0;
        let mut buffer = String::new();

        for ch in self.remaining().chars() {
            if !Lexer::is_numeric(ch) {
                break;
            }

            buffer.push(ch);
            len += ch.len_utf8();
        }

        self.consume_n_minus_one(len);

        buffer.parse::<i64>().unwrap()
    }

    fn advance(&mut self) -> Spanned<Token> {
        self.strip_whitespace();
        self.strip_comments();

        let then = self.cursor;

        // TODO: More tokens
        let token = match self.current() {
            Some('=') => match self.peek() {
                Some('=') => {
                    self.consume();
                    Token::Eq
                }
                Some('>') => {
                    self.consume();
                    Token::FatArrow
                }
                _ => Token::Assign,
            },
            Some('>') => match self.peek() {
                Some('=') => {
                    self.consume();
                    Token::GtEq
                }
                _ => Token::Gt,
            },
            Some('<') => match self.peek() {
                Some('=') => {
                    self.consume();
                    Token::LtEq
                }
                _ => Token::Lt,
            },
            Some('(') => Token::OpenParen,
            Some(')') => Token::CloseParen,
            Some('{') => Token::OpenBrace,
            Some('}') => Token::CloseBrace,
            Some(':') => Token::Colon,
            Some('.') => Token::Dot,
            Some(';') => Token::Semicolon,
            Some('+') => Token::Plus,
            Some('-') => match self.peek() {
                Some('>') => {
                    self.consume();
                    Token::RightArrow
                }
                Some('=') => {
                    self.consume();
                    Token::SubAssign
                }
                _ => Token::Minus,
            },
            Some('/') => match self.peek() {
                Some('=') => {
                    self.consume();
                    Token::DivAssign
                }
                _ => Token::Slash,
            },
            Some('!') => match self.peek() {
                Some('=') => {
                    self.consume();
                    Token::NotEq
                }
                _ => Token::Bang,
            },
            Some('\'') => {
                if let Some(ch) = self.read_char_literal() {
                    Token::CharLiteral(ch)
                } else {
                    Token::Illegal
                }
            }
            Some('"') => {
                if let Some(s) = self.read_string_literal() {
                    Token::StringLiteral(s)
                } else {
                    Token::Illegal
                }
            }
            Some('\n') => Token::Newline,
            Some(ch) => {
                if Lexer::is_alpha(ch) {
                    let ident = self.read_identifier();

                    Lexer::lookup_keyword(ident)
                } else if Lexer::is_numeric(ch) {
                    // TODO: implement float matching
                    // TODO: implement hexidecimal, octal, and binary matching

                    let literal = self.read_decimal_literal();

                    Token::IntegerLiteral(literal)
                } else {
                    let mut buf = String::new();

                    loop {
                        let ch = match self.current() {
                            Some(ch) => if ch.is_whitespace() { break } else { ch }
                            None => break
                        };

                        buf.push(ch);

                        self.consume();
                    }

                    self.errors.push(LexerError::new(
                        &format!("unexpected token `{}`", buf),
                        &Span::new(&self.source, then, self.cursor - then))
                    );

                    Token::Illegal
                }
            }
            _ => Token::End,
        };

        self.consume();

        Spanned::new(
            token,
            Span::new(&self.source, then, self.cursor - then),
        )
    }
}

#[cfg(test)]
mod test {
    use super::*;

    fn compare_tokens(tests: &Vec<Token>, tokens: &Vec<Spanned<Token>>) {
        for (test, token) in tests.iter().zip(tokens.iter()) {
            assert_eq!(*test, token.item);
        }
    }

    #[test]
    fn empty_source() {
        let source = Source::pathless("   ");
        let tests = vec![Token::End];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn let_statement() {
        let source = Source::pathless("let five = 5");

        let tests = vec![
            Token::Let,
            Token::Identifier(String::from("five")),
            Token::Assign,
            Token::IntegerLiteral(5),
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn function_item() {
        let source = Source::pathless(
            "
            fn main() -> void {
                let five: i32 = 5; let ten = 10
                return five + ten
            }
        ",
        );

        let tests = vec![
            Token::Newline,
            Token::Fn,
            Token::Identifier(String::from("main")),
            Token::OpenParen,
            Token::CloseParen,
            Token::RightArrow,
            Token::Identifier(String::from("void")),
            Token::OpenBrace,
            Token::Newline,
            Token::Let,
            Token::Identifier(String::from("five")),
            Token::Colon,
            Token::Identifier(String::from("i32")),
            Token::Assign,
            Token::IntegerLiteral(5),
            Token::Semicolon,
            Token::Let,
            Token::Identifier(String::from("ten")),
            Token::Assign,
            Token::IntegerLiteral(10),
            Token::Newline,
            Token::Return,
            Token::Identifier(String::from("five")),
            Token::Plus,
            Token::Identifier(String::from("ten")),
            Token::Newline,
            Token::CloseBrace,
            Token::Newline,
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn single_line_comments() {
        let source = Source::pathless(
            "// miss me with that bullshit
            i = 3 // ignore me
            /15",
        );

        let tests = vec![
            Token::Newline,
            Token::Identifier(String::from("i")),
            Token::Assign,
            Token::IntegerLiteral(3),
            Token::Newline,
            Token::Slash,
            Token::IntegerLiteral(15),
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn character_literals() {
        let source = Source::pathless(
            r#"'a'
            'b'
            'c''\n'"#,
        );

        let tests = vec![
            Token::CharLiteral('a'),
            Token::Newline,
            Token::CharLiteral('b'),
            Token::Newline,
            Token::CharLiteral('c'),
            Token::CharLiteral('\n'),
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn string_literals() {
        let source = Source::pathless(r#""ghibli" "newlines\r\n" "not a real // comment""#);

        let tests = vec![
            Token::StringLiteral(String::from("ghibli")),
            Token::StringLiteral(String::from("newlines\r\n")),
            Token::StringLiteral(String::from("not a real // comment")),
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }

    #[test]
    fn spanned() {
        let source = Source::pathless(" five ten \n");

        let tests = vec![
            Span::new(&source, 1, 4),
            Span::new(&source, 6, 3),
            Span::new(&source, 10, 1),
        ];

        for (spanned, test) in lex(&source).unwrap().iter().zip(tests.iter()) {
            assert_eq!(spanned.span, *test);
        }
    }

    #[test]
    fn conditionals() {
        let source = Source::pathless(
            "
            if (i == 3) {
                return !i
            } else if i <= 2 {
                return -2
            } else {
                return i > 15
            }
        ",
        );

        let tests = vec![
            Token::Newline,
            Token::If,
            Token::OpenParen,
            Token::Identifier(String::from("i")),
            Token::Eq,
            Token::IntegerLiteral(3),
            Token::CloseParen,
            Token::OpenBrace,
            Token::Newline,
            Token::Return,
            Token::Bang,
            Token::Identifier(String::from("i")),
            Token::Newline,
            Token::CloseBrace,
            Token::Else,
            Token::If,
            Token::Identifier(String::from("i")),
            Token::LtEq,
            Token::IntegerLiteral(2),
            Token::OpenBrace,
            Token::Newline,
            Token::Return,
            Token::Minus,
            Token::IntegerLiteral(2),
            Token::Newline,
            Token::CloseBrace,
            Token::Else,
            Token::OpenBrace,
            Token::Newline,
            Token::Return,
            Token::Identifier(String::from("i")),
            Token::Gt,
            Token::IntegerLiteral(15),
            Token::Newline,
            Token::CloseBrace,
            Token::Newline,
            Token::End,
        ];

        compare_tokens(&tests, &lex(&source).unwrap());
    }
}
