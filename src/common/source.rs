use std::{
    path::PathBuf,
    io::Read,
    fs::File
};

#[derive(Debug, PartialEq, Clone)]
pub struct Source {
    pub contents: String,
    pub path: PathBuf
}

impl Source {
    pub fn new(contents: &str, path: &PathBuf) -> Source {
        Source {
            contents: contents.to_string(),
            path: path.clone()
        }
    }

    pub fn path(path: PathBuf) -> std::io::Result<Source> {
        let mut contents = String::new();
        let mut file = File::open(path.clone())?;
        file.read_to_string(&mut contents)?;

        Ok(Source::new(&contents, &path))
    }

    pub fn pathless(source: &str) -> Source {
        Source::new(&source.to_string(), &PathBuf::from("[no path]"))
    }
}