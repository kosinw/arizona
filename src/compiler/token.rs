#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Delimeters
    OpenBracket,
    CloseBracket,
    OpenParen,
    CloseParen,
    OpenBrace,
    CloseBrace,

    // Punctuation
    Semicolon,
    Comma,
    Colon,
    Newline,

    // Arithmetic operators
    Plus,
    Minus,
    Slash,
    Asterisk,
    Mod,

    // Conditional operators
    Bang,
    Eq,
    NotEq,
    Gt,
    Lt,
    GtEq,
    LtEq,

    // Other operators
    Dot,
    RightArrow,
    FatArrow,

    // Assignment operators
    Assign,
    AddAssign,
    SubAssign,
    MulAssign,
    DivAssign,
    ModAssign,

    // Keywords
    If,
    Else,
    For,
    While,
    Fn,
    Enum,
    Struct,
    Union,
    Break,
    Continue,
    Let,
    Match,
    Return,

    // Identifier
    Identifier(String),

    // Literals
    IntegerLiteral(i64),
    FloatLiteral(f64),
    StringLiteral(String),
    CharLiteral(char),
    BooleanLiteral(bool),

    // Illegal
    Illegal,
    // EOF
    End,
}