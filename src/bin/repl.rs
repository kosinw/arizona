extern crate arizona;
use arizona::compiler::lexer::lex;
use arizona::common::source::Source;
use arizona::compiler::syntax_error::report;

extern crate rustyline;

static BINARY_VERSION: &'static str = env!("CARGO_PKG_VERSION");
static PROMPT: &'static str = ">>> ";

fn main() {
    println!("Arizona Programming Language {} (written by Kosi Nwabueze)", BINARY_VERSION);
    println!(r#"Type "{}" or "{}" for more information."#, "help", "license");
    let mut rl = rustyline::Editor::<()>::new();

    loop {
        let readline = rl.readline(PROMPT);

        match readline {
            Ok(line) => {
                let source = Source::pathless(&line);
                let (tokens, errors) = lex(&source);

                if !errors.is_empty() {
                    report(&errors).unwrap();
                }

                for token in tokens {
                    println!("{:?}", token);
                }
            }
            Err(_) => break
        }
    }
}
