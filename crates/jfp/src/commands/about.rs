//! About command implementation

use std::process::ExitCode;

const VERSION: &str = env!("CARGO_PKG_VERSION");

pub fn run(use_json: bool) -> ExitCode {
    if use_json {
        let about = serde_json::json!({
            "name": "jfp",
            "version": VERSION,
            "description": "Agent-optimized CLI for JeffreysPrompts.com",
            "author": "Jeffrey Emanuel",
            "website": "https://jeffreysprompts.com",
            "repository": "https://github.com/Dicklesworthstone/jeffreysprompts.com"
        });
        match serde_json::to_string_pretty(&about) {
            Ok(json) => println!("{}", json),
            Err(e) => {
                eprintln!("{{\"error\": \"Failed to serialize: {}\"}}", e);
                return ExitCode::FAILURE;
            }
        }
    } else {
        println!("jfp v{}", VERSION);
        println!();
        println!("Agent-optimized CLI for JeffreysPrompts.com");
        println!();
        println!("Browse, search, and use curated prompts for AI coding agents.");
        println!();
        println!("Author:  Jeffrey Emanuel");
        println!("Website: https://jeffreysprompts.com");
        println!("Source:  https://github.com/Dicklesworthstone/jeffreysprompts.com");
    }
    ExitCode::SUCCESS
}
