//! Output formatting utilities for JSON and terminal output

use serde::Serialize;

/// Print output in JSON or human-readable format
pub fn print_output<T: Serialize + std::fmt::Display>(data: &T, use_json: bool) {
    if use_json {
        match serde_json::to_string_pretty(data) {
            Ok(json) => println!("{}", json),
            Err(e) => eprintln!("Error serializing to JSON: {}", e),
        }
    } else {
        println!("{}", data);
    }
}

/// Print error in JSON or human-readable format
pub fn print_error(message: &str, use_json: bool) {
    if use_json {
        let error = serde_json::json!({
            "error": message
        });
        eprintln!("{}", serde_json::to_string_pretty(&error).unwrap_or_default());
    } else {
        eprintln!("Error: {}", message);
    }
}
