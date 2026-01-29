//! Show command implementation

use std::process::ExitCode;

pub fn run(_id: &str, _raw: bool, use_json: bool) -> ExitCode {
    if use_json {
        println!(r#"{{"error": "Not yet implemented"}}"#);
    } else {
        println!("Show command not yet implemented");
    }
    ExitCode::FAILURE
}
