use crate::common::span::*;

#[derive(PartialEq, Debug, Clone)]
pub enum Literal {
    Char(char),
    Integer(i64),
    Float(f64),
    String(String),
    Boolean(bool)
}

#[derive(PartialEq, Debug, Clone)]
pub enum ExprKind {
    // TODO: Upgrade first argument to Pattern
    // TODO: Upgrade second argument to Type
    /// A `let` expression introduces a new variable to the local scope.
    /// 
    /// Type annotation will be inferred if not included explicitly.
    /// The compiler will raise an error if the type cannot be inferred implicitly.
    /// 
    /// ## Grammar
    /// ```ignore
    /// LetExpr:    "let" IDENTIFIER (":" Type)? ("=" Expr)?
    /// ```
    /// 
    LetExpr(Spanned<String>, Option<Spanned<String>>, Option<Box<Expr>>),

    /// A literal expression consists of a literal form.
    /// Literals include characters, integers, floats, strings, and booleans.
    /// 
    /// ## Grammar
    /// ```ignore
    /// LiteralExpr:    CHAR_LITERAL
    ///                 | INTEGER_LITERAL
    ///                 | FLOAT_LITERAL
    ///                 | STRING_LITERAL
    ///                 | BOOLEAN_LITERAL
    /// ```
    /// 
    LiteralExpr(Literal),
}

/// Represents a component of an item.
/// There are no statements in `arizona`, everything is an expression!
/// 
/// ## Grammar
/// ```ignore
/// EndExpr:            "\n"
///                     | ";"
///                     | EOF
/// 
/// Expr:               ExprWithBlock EndExpr
///                     | ExprWithoutBlock EndExpr
/// 
/// ExprWithoutBlock:   LetExpr
///                     | CallExpr
///                     | ContinueExpr
///                     | BreakExpr
///                     | ReturnExpr
///                     | ValueExpr
///                     | LiteralExpr
/// 
/// ExprWithBlock:      BlockExpr
///                     | IfExpr
///                     | MatchExpr
///                     | WhileExpr
///                     | ForExpr
/// ```
/// 
pub type Expr = Spanned<ExprKind>;

// TODO: Finish making variants for DeclKind
#[derive(PartialEq, Debug, Clone)]
pub enum DeclKind {}

/// Represents a top-level component of a compilation unit.
/// Every compilation unit is made up of items.
/// 
/// ## Grammar
/// ```ignore
/// Decl:    UseDecl
///          | FunctionDecl
///          | StructDecl
///          | UnionDecl
///          | ConstDecl
/// ```
/// 
pub type Decl = Spanned<DeclKind>;

/// Represents one compilation unit.
/// _Compilation units_ can be linked together into _packages_.
/// 
/// ## Grammar
/// ```ignore
/// CompilationUnit:    Decl*
/// ```
pub type CompilationUnit = Spanned<Vec<Decl>>;