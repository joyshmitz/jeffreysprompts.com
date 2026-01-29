//! Search command implementation

use std::process::ExitCode;

pub fn run(_query: &str, _limit: usize, use_json: bool) -> ExitCode {
    if use_json {
        println!(r#"{{"results": [], "message": "Not yet implemented"}}"#);
    } else {
        println!("Search command not yet implemented");
    }
    ExitCode::SUCCESS
}
