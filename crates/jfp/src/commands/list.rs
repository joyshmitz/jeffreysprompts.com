//! List command implementation

use std::process::ExitCode;

pub fn run(
    _category: Option<String>,
    _tag: Option<String>,
    _featured: bool,
    use_json: bool,
) -> ExitCode {
    if use_json {
        println!(r#"{{"prompts": [], "message": "Not yet implemented"}}"#);
    } else {
        println!("List command not yet implemented");
    }
    ExitCode::SUCCESS
}
