use crate::common::span::Span;
use codespan_reporting::diagnostic::{Diagnostic, Label};
use codespan_reporting::term::termcolor::{ColorChoice, StandardStream};
use codespan_reporting::term;

// TODO: implement syntax error
#[derive(Debug, Clone, PartialEq)]
pub struct SyntaxError {
    pub span: Span,
    pub message: String,
}

pub type SyntaxErrors = Vec<SyntaxError>;

pub fn report(errors: &SyntaxErrors) -> Result<(), codespan_reporting::files::Error> {
    let writer = StandardStream::stderr(ColorChoice::Always);
    let config = codespan_reporting::term::Config::default();

    for error in errors {
        let source = &*error.span.source.as_ref().unwrap();

        term::emit(&mut writer.lock(), &config, &**source, &error.diagnostic())?;
    }

    Ok(())
}

impl SyntaxError {
    pub fn new(message: &str, span: &Span) -> SyntaxError {
        SyntaxError {
            span: span.clone(),
            message: message.to_string(),
        }
    }

    // TODO: Somehow add secondary labels to error messages?
    pub fn diagnostic(&self) -> Diagnostic<()> {
        let begin = self.span.offset;
        let end = begin + self.span.length;

        Diagnostic::error()
            .with_message(&self.message)
            .with_labels(vec![
                Label::primary((), begin..end).with_message(&self.message)
            ])
    }
}
