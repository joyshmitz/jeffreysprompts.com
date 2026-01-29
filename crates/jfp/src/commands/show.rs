//! Show command implementation
//!
//! From EXISTING_JFP_STRUCTURE.md section 10 (show):
//! - Options: --json, --raw
//! - Not found: JSON payload is exactly { "error": "not_found" }

use std::process::ExitCode;

use serde::Serialize;

use crate::registry::bundled_prompts;
use crate::storage::Database;
use crate::types::Prompt;

/// Full prompt output for JSON
#[derive(Serialize)]
struct ShowOutput {
    id: String,
    title: String,
    content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    category: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    tags: Vec<String>,
    featured: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    author: Option<String>,
}

impl From<&Prompt> for ShowOutput {
    fn from(p: &Prompt) -> Self {
        Self {
            id: p.id.clone(),
            title: p.title.clone(),
            content: p.content.clone(),
            description: p.description.clone(),
            category: p.category.clone(),
            tags: p.tags.clone(),
            featured: p.featured,
            version: p.version.clone(),
            author: p.author.clone(),
        }
    }
}

pub fn run(id: &str, raw: bool, use_json: bool) -> ExitCode {
    // Validate ID
    if id.trim().is_empty() {
        if use_json {
            println!(r#"{{"error": "invalid_id"}}"#);
        } else {
            eprintln!("Error: Prompt ID cannot be empty");
        }
        return ExitCode::FAILURE;
    }

    // Open database
    let db = match Database::open() {
        Ok(db) => db,
        Err(e) => {
            if use_json {
                println!(r#"{{"error": "database_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error opening database: {}", e);
            }
            return ExitCode::FAILURE;
        }
    };

    // Seed if empty
    let count = db.prompt_count().unwrap_or(0);
    if count == 0 {
        let prompts = bundled_prompts();
        for prompt in &prompts {
            let _ = db.upsert_prompt(prompt);
        }
    }

    // Get prompt
    let prompt = match db.get_prompt(id) {
        Ok(Some(p)) => p,
        Ok(None) => {
            // Not found - per spec: exactly { "error": "not_found" }
            if use_json {
                println!(r#"{{"error": "not_found"}}"#);
            } else {
                eprintln!("Prompt not found: {}", id);
            }
            return ExitCode::FAILURE;
        }
        Err(e) => {
            if use_json {
                println!(r#"{{"error": "database_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error loading prompt: {}", e);
            }
            return ExitCode::FAILURE;
        }
    };

    // Output
    if raw {
        // Raw mode: just print content
        print!("{}", prompt.content);
    } else if use_json {
        let output = ShowOutput::from(&prompt);
        match serde_json::to_string_pretty(&output) {
            Ok(json) => println!("{}", json),
            Err(e) => {
                println!(r#"{{"error": "serialization_error", "message": "{}"}}"#, e);
                return ExitCode::FAILURE;
            }
        }
    } else {
        // Human-readable output
        println!("# {} - {}", prompt.id, prompt.title);
        println!();

        if let Some(desc) = &prompt.description {
            println!("{}", desc);
            println!();
        }

        if let Some(cat) = &prompt.category {
            print!("Category: {}  ", cat);
        }
        if !prompt.tags.is_empty() {
            print!("Tags: {}", prompt.tags.join(", "));
        }
        if prompt.featured {
            print!("  [Featured]");
        }
        println!("\n");

        println!("---");
        println!("{}", prompt.content);
        println!("---");

        if let Some(author) = &prompt.author {
            println!("\nAuthor: {}", author);
        }
        if let Some(version) = &prompt.version {
            println!("Version: {}", version);
        }
    }

    ExitCode::SUCCESS
}
