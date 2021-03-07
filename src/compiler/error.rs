use crate::common::source::Source;
use crate::common::span::*;
use crate::compiler::token::*;
use codespan_reporting::diagnostic::{Diagnostic, Label};
use codespan_reporting::term;
use codespan_reporting::term::termcolor::{ColorChoice, StandardStream};
use std::fmt;
use std::rc::Rc;

pub trait GenDiagnostic {
    fn get_source(&self) -> &Rc<Source>;
    fn error(&self) -> Diagnostic<()>;
}

pub fn report<'files>(
    errors: &Vec<impl GenDiagnostic>,
) -> Result<(), codespan_reporting::files::Error> {
    let writer = StandardStream::stderr(ColorChoice::Always);
    let config = codespan_reporting::term::Config::default();

    for error in errors {
        let source = Rc::clone(error.get_source());

        term::emit(&mut writer.lock(), &config, &*source, &error.error())?;
    }

    Ok(())
}

// TODO: Turn lexer error based on sum type
// TODO: Combine lexer error with parser and semantic errors
#[derive(Debug, Clone, PartialEq)]
pub struct LexerError {
    pub span: Span,
    pub message: String,
    pub labels: Vec<Label<()>>,
}

pub type LexerErrors = Vec<LexerError>;

#[derive(Debug, Clone, PartialEq)]
pub enum ParserErrorKind {
    UnexpectedToken { expected: Token, got: Token },
    UnexpectedEOF,
    ExpectedIdentifier(Token),
    ExpectedEndExpr(Token),
    ExpectedInteger(Token),
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParserError {
    pub kind: ParserErrorKind,
    pub span: Span,
    pub labels: Vec<Label<()>>,
}

pub type ParserErrors = Vec<ParserError>;

impl LexerError {
    pub fn new(message: &str, span: &Span) -> LexerError {
        LexerError {
            span: span.clone(),
            message: message.to_string(),
            labels: vec![],
        }
    }
}

impl GenDiagnostic for LexerError {
    // TODO: Somehow add secondary labels to error messages?
    fn error(&self) -> Diagnostic<()> {
        let begin = self.span.offset;
        let end = self.span.end();

        let mut labels = self.labels.clone();
        labels.push(Label::primary((), begin..end).with_message(&self.message));

        Diagnostic::error()
            .with_message(format!("lexer error: {}", self.message))
            .with_labels(labels)
    }

    fn get_source(&self) -> &Rc<Source> {
        self.span.source.as_ref().unwrap()
    }
}

impl ParserError {
    pub fn new(kind: ParserErrorKind, span: &Span) -> ParserError {
        ParserError {
            kind,
            span: span.clone(),
            labels: vec![],
        }
    }
}

impl fmt::Display for ParserErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            // TODO: implement Display for Token
            ParserErrorKind::UnexpectedToken { expected, got } => {
                write!(f, "expected `{:?}`, instead got `{:?}`", expected, got)
            }
            ParserErrorKind::UnexpectedEOF => write!(f, "unexpected EOF while parsing file"),
            ParserErrorKind::ExpectedIdentifier(t) => {
                write!(f, "expected identifier, instead got `{:?}`", t)
            }
            ParserErrorKind::ExpectedEndExpr(t) => write!(
                f,
                "expected either `;`, newline, or EOF, instead got `{:?}`",
                t
            ),
            ParserErrorKind::ExpectedInteger(t) => {
                write!(f, "expected integer literal instead got `{:?}`", t)
            }
        }
    }
}

impl GenDiagnostic for ParserError {
    // TODO: Somehow add secondary labels to error messages?
    fn error(&self) -> Diagnostic<()> {
        let begin = self.span.offset;
        let end = self.span.end();

        let mut labels = self.labels.clone();
        labels.push(Label::primary((), begin..end).with_message(&self.kind.to_string()));

        Diagnostic::error()
            .with_message(format!("parser error: {}", &self.kind.to_string()))
            .with_labels(labels)
    }

    fn get_source(&self) -> &Rc<Source> {
        self.span.source.as_ref().unwrap()
    }
}
