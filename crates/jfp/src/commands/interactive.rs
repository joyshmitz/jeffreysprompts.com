//! Interactive mode stub
//!
//! From PLAN_TO_PORT_JFP_TO_RUST.md:
//! Interactive mode is excluded from Phase 1 (MVP)
//! Planned for Phase 5 with TUI library integration

use std::process::ExitCode;

pub fn run(use_json: bool) -> ExitCode {
    if use_json {
        println!(r#"{{"error": "not_implemented", "command": "interactive", "message": "Interactive mode is planned for a future release"}}"#);
    } else {
        eprintln!("Interactive mode is not yet implemented.");
        eprintln!();
        eprintln!("This feature is planned for a future release.");
        eprintln!("In the meantime, you can use:");
        eprintln!("  jfp list           - Browse all prompts");
        eprintln!("  jfp search <query> - Search for prompts");
        eprintln!("  jfp suggest <task> - Get suggestions for your task");
    }

    ExitCode::FAILURE
}
