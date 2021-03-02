use std::{fs::File, io::Read, path::PathBuf, rc::Rc};

#[derive(Debug, PartialEq, Clone)]
pub struct Source {
    pub contents: String,
    pub path: PathBuf,
}

impl Source {
    pub fn new(contents: &str, path: &PathBuf) -> Rc<Source> {
        Rc::new(Source {
            contents: contents.to_string(),
            path: path.clone(),
        })
    }

    pub fn path(path: PathBuf) -> std::io::Result<Rc<Source>> {
        let mut contents = String::new();
        let mut file = File::open(path.clone())?;
        file.read_to_string(&mut contents)?;

        Ok(Source::new(&contents, &path))
    }

    pub fn pathless(source: &str) -> Rc<Source> {
        Source::new(&source.to_string(), &PathBuf::from("[no path]"))
    }
}
