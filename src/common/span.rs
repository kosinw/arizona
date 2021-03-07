use crate::common::source::Source;
use std::rc::Rc;

#[derive(Debug, Clone, PartialEq)]
pub struct Span {
    pub offset: usize,
    pub length: usize,
    pub source: Option<Rc<Source>> 
}

#[derive(Debug, Clone, PartialEq)]
pub struct Spanned<T> {
    pub item: T,
    pub span: Span,
}

impl Span {
    pub fn new(source: &Rc<Source>, offset: usize, length: usize) -> Span {
        Span { source: Some(Rc::clone(source)), offset, length }
    }

    pub fn point(source: &Rc<Source>, offset: usize) -> Span {
        // NOTE: maybe it should be 0?
        Span { source: Some(Rc::clone(source)), offset, length: 0 }
    }

    pub fn empty() -> Span {
        Span { source: None, offset: 0, length: usize::MAX }
    }

    pub fn is_empty(&self) -> bool {
        self.source == None
    }

    pub fn end(&self) -> usize {
        self.offset + self.length
    }

    pub fn later_than(&self, other: &Span) -> bool {
        self.offset > other.offset
           || (self.offset == other.offset
              && self.end() > other.end())
    }

    pub fn combine(a: &Span, b: &Span) -> Span {
        if a.is_empty() { return b.clone(); }
        if b.is_empty() { return a.clone(); }

        if a.source != b.source {
            panic!("Can't combine two Spans with separate sources")
        }

        let offset = a.offset.min(b.offset);
        let end    = a.end().max(b.end());
        let length = end - offset;

        return Span::new(&a.source.as_ref().unwrap(), offset, length);
    }

    pub fn join(mut spans: Vec<Span>) -> Span {
        let mut combined = match spans.pop() {
            Some(span) => span,
            None       => return Span::empty(),
        };

        while let Some(span) = spans.pop() {
            combined = Span::combine(&combined, &span)
        }

        return combined;
    }
}

impl<T> Spanned<T> {
    pub fn new(item: T, span: Span) -> Spanned<T> {
        Spanned { item, span }
    }

    fn join(mut spans: Vec<Span>) -> Span {
        let mut combined = match spans.pop() {
            Some(span) => span,
            None => Span::empty()
        };
    
        while let Some(span) = spans.pop() {
            combined = Span::combine(&combined, &span);
        }
    
        combined
    }
    

    pub fn build(spanneds: &Vec<Spanned<T>>) -> Span {
        let spans: Vec<_> = spanneds.iter().map(|s| s.span.clone()).collect();
       
        Spanned::<T>::join(spans)
    }
}
