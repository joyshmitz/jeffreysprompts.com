//! Tags command implementation

use std::process::ExitCode;

pub fn run(use_json: bool) -> ExitCode {
    if use_json {
        println!(r#"{{"tags": [], "message": "Not yet implemented"}}"#);
    } else {
        println!("Tags command not yet implemented");
    }
    ExitCode::SUCCESS
}
