//! Categories command implementation

use std::process::ExitCode;

pub fn run(use_json: bool) -> ExitCode {
    let categories = vec![
        "ideation",
        "documentation",
        "automation",
        "refactoring",
        "testing",
        "debugging",
        "workflow",
        "communication",
    ];

    if use_json {
        let json = serde_json::json!({
            "categories": categories,
            "count": categories.len()
        });
        match serde_json::to_string_pretty(&json) {
            Ok(output) => println!("{}", output),
            Err(e) => {
                eprintln!("{{\"error\": \"Failed to serialize: {}\"}}", e);
                return ExitCode::FAILURE;
            }
        }
    } else {
        println!("Categories ({}):", categories.len());
        for cat in &categories {
            println!("  - {}", cat);
        }
    }
    ExitCode::SUCCESS
}
