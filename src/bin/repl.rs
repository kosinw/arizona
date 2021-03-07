extern crate arizona;

use arizona::{common::source::*, compiler::error::*, compiler::lexer::*, common::span::*};

extern crate rustyline;

static BINARY_VERSION: &'static str = env!("CARGO_PKG_VERSION");
static PROMPT: &'static str = ">>> ";

fn main() {
    println!(
        "Arizona Programming Language {} (written by Kosi Nwabueze)",
        BINARY_VERSION
    );
    println!(
        r#"Type "{}" or "{}" for more information."#,
        "help", "license"
    );
    let mut rl = rustyline::Editor::<()>::new();

    loop {
        let readline = rl.readline(PROMPT);

        match readline {
            Ok(line) => {
                let source = Source::pathless(&line);

                let tokens = match lex(&source) {
                    Ok(tokens) => {
                        for Spanned { item, ..} in tokens.clone() {
                            println!("{:?}", item);
                        }

                        tokens
                    }
                    Err(errors) => {
                        report(&errors).unwrap();
                        continue;
                    }
                };
            }
            Err(_) => break,
        }
    }
}
