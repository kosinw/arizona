use codespan_reporting::files::{line_starts, Error, Files};
use std::{fs::File, io::Read, ops::Range, path::PathBuf, rc::Rc};

// TODO: Update this to multi-file database instead of a single source file.
#[derive(Debug, PartialEq, Clone)]
pub struct Source {
    pub contents: String,
    pub path: PathBuf,
    line_starts: Vec<usize>,
}

impl Source {
    pub fn new(contents: &str, path: &PathBuf) -> Rc<Source> {
        Rc::new(Source {
            contents: contents.to_string(),
            path: path.clone(),
            line_starts: line_starts(contents).collect(),
        })
    }

    pub fn path(path: PathBuf) -> std::io::Result<Rc<Source>> {
        let mut contents = String::new();
        let mut file = File::open(path.clone())?;
        file.read_to_string(&mut contents)?;

        Ok(Source::new(&contents, &path))
    }

    pub fn pathless(source: &str) -> Rc<Source> {
        Source::new(&source.to_string(), &PathBuf::from("<stdin>"))
    }

    fn line_start(&self, line_index: usize) -> Result<usize, Error> {
        use std::cmp::Ordering;

        match line_index.cmp(&self.line_starts.len()) {
            Ordering::Less => Ok(self
                .line_starts
                .get(line_index)
                .cloned()
                .expect("failed despite previous check")),
            Ordering::Equal => Ok(self.contents.len()),
            Ordering::Greater => Err(Error::LineTooLarge {
                given: line_index,
                max: self.line_starts.len() - 1,
            }),
        }
    }
}

// TODO: Maybe replace this with official implementation from codespan crate?
impl<'a> Files<'a> for Source {
    type FileId = ();
    type Name = String;
    type Source = String;

    fn name(&self, (): ()) -> Result<Self::Name, Error> {
        Ok(String::from(self.path.to_string_lossy()))
    }

    fn source(&self, (): ()) -> Result<Self::Source, Error> {
        Ok(self.contents.clone())
    }

    fn line_index(&self, (): (), byte_index: usize) -> Result<usize, Error> {
        Ok(self
            .line_starts
            .binary_search(&byte_index)
            .unwrap_or_else(|next_line| next_line - 1))
    }

    fn line_range(&self, (): (), line_index: usize) -> Result<Range<usize>, Error> {
        let line_start = self.line_start(line_index)?;
        let next_line_start = self.line_start(line_index + 1)?;

        Ok(line_start..next_line_start)
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn codespan() {
        let source = Source::pathless("let a = 3");

        assert_eq!(String::from("[no path]"), source.name(()).unwrap());
        assert_eq!(source.contents, source.source(()).unwrap());
        assert_eq!(0, source.line_index((), 3).unwrap());
    }
}