#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Delimeters
    OpenBracket, CloseBracket,
    OpenParen, CloseParen,
    OpenBrace, CloseBrace,
    Dot,

    // Punctuation
    Semicolon,
    Comma,
    Colon,
    
    // EOF
    End
}