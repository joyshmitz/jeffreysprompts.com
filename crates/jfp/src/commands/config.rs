//! Config command implementation
//!
//! From EXISTING_JFP_STRUCTURE.md section 13 (config):
//! - Actions: get, set, list, reset, path
//! - Reads/writes config file at XDG config path

use std::fs;
use std::path::PathBuf;
use std::process::ExitCode;

use serde::Serialize;

/// Get the config directory
fn config_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("jfp"))
}

/// Get the config file path
fn config_path() -> Option<PathBuf> {
    config_dir().map(|d| d.join("config.toml"))
}

#[derive(Serialize)]
struct ConfigOutput {
    #[serde(skip_serializing_if = "Option::is_none")]
    action: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    value: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<toml::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn emit_json(output: &ConfigOutput) -> ExitCode {
    match serde_json::to_string_pretty(output) {
        Ok(json) => {
            println!("{}", json);
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!(r#"{{"error": "serialization_error", "message": "{}"}}"#, e);
            ExitCode::FAILURE
        }
    }
}

pub fn run(action: &str, key: Option<String>, value: Option<String>, use_json: bool) -> ExitCode {
    match action {
        "path" => show_path(use_json),
        "list" => list_config(use_json),
        "get" => {
            if let Some(k) = key {
                get_config(&k, use_json)
            } else {
                if use_json {
                    println!(r#"{{"error": "missing_key"}}"#);
                } else {
                    eprintln!("Error: 'get' requires a key");
                }
                ExitCode::FAILURE
            }
        }
        "set" => {
            if let (Some(k), Some(v)) = (key, value) {
                set_config(&k, &v, use_json)
            } else {
                if use_json {
                    println!(r#"{{"error": "missing_key_or_value"}}"#);
                } else {
                    eprintln!("Error: 'set' requires a key and value");
                }
                ExitCode::FAILURE
            }
        }
        "reset" => reset_config(use_json),
        _ => {
            if use_json {
                println!(r#"{{"error": "invalid_action", "action": "{}"}}"#, action);
            } else {
                eprintln!("Invalid action: {}. Use: list, get, set, reset, path", action);
            }
            ExitCode::FAILURE
        }
    }
}

fn show_path(use_json: bool) -> ExitCode {
    let path = config_path();

    if use_json {
        let output = ConfigOutput {
            action: Some("path".to_string()),
            key: None,
            value: None,
            path: path.as_ref().map(|p| p.display().to_string()),
            config: None,
            error: None,
        };
        return emit_json(&output);
    } else {
        match path {
            Some(p) => {
                println!("{}", p.display());
                if p.exists() {
                    println!("(file exists)");
                } else {
                    println!("(file does not exist yet)");
                }
            }
            None => {
                eprintln!("Could not determine config path");
                return ExitCode::FAILURE;
            }
        }
    }

    ExitCode::SUCCESS
}

fn list_config(use_json: bool) -> ExitCode {
    let path = match config_path() {
        Some(p) => p,
        None => {
            if use_json {
                println!(r#"{{"error": "no_config_path"}}"#);
            } else {
                eprintln!("Could not determine config path");
            }
            return ExitCode::FAILURE;
        }
    };

    let config: toml::Value = if path.exists() {
        let content = match fs::read_to_string(&path) {
            Ok(c) => c,
            Err(e) => {
                if use_json {
                    println!(r#"{{"error": "read_error", "message": "{}"}}"#, e);
                } else {
                    eprintln!("Error reading config: {}", e);
                }
                return ExitCode::FAILURE;
            }
        };
        match content.parse() {
            Ok(v) => v,
            Err(e) => {
                if use_json {
                    println!(r#"{{"error": "parse_error", "message": "{}"}}"#, e);
                } else {
                    eprintln!("Error parsing config: {}", e);
                }
                return ExitCode::FAILURE;
            }
        }
    } else {
        toml::Value::Table(toml::map::Map::new())
    };

    if use_json {
        let output = ConfigOutput {
            action: Some("list".to_string()),
            key: None,
            value: None,
            path: Some(path.display().to_string()),
            config: Some(config),
            error: None,
        };
        return emit_json(&output);
    } else {
        println!("Config file: {}", path.display());
        println!();
        if let toml::Value::Table(t) = config {
            if t.is_empty() {
                println!("(no configuration set)");
            } else {
                for (k, v) in t {
                    println!("{} = {}", k, v);
                }
            }
        }
    }

    ExitCode::SUCCESS
}

fn get_config(key: &str, use_json: bool) -> ExitCode {
    let path = match config_path() {
        Some(p) => p,
        None => {
            if use_json {
                println!(r#"{{"error": "no_config_path"}}"#);
            } else {
                eprintln!("Could not determine config path");
            }
            return ExitCode::FAILURE;
        }
    };

    if !path.exists() {
        if use_json {
            println!(r#"{{"error": "not_found", "key": "{}"}}"#, key);
        } else {
            eprintln!("Key '{}' not found (config file doesn't exist)", key);
        }
        return ExitCode::FAILURE;
    }

    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            if use_json {
                println!(r#"{{"error": "read_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error reading config: {}", e);
            }
            return ExitCode::FAILURE;
        }
    };

    let config: toml::Value = match content.parse() {
        Ok(v) => v,
        Err(e) => {
            if use_json {
                println!(r#"{{"error": "parse_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error parsing config: {}", e);
            }
            return ExitCode::FAILURE;
        }
    };

    let value = config.get(key);

    if use_json {
        let output = ConfigOutput {
            action: Some("get".to_string()),
            key: Some(key.to_string()),
            value: value.map(|v| v.to_string()),
            path: None,
            config: None,
            error: if value.is_none() { Some("not_found".to_string()) } else { None },
        };
        let status = emit_json(&output);
        if status != ExitCode::SUCCESS {
            return status;
        }
        if value.is_none() {
            return ExitCode::FAILURE;
        }
    } else {
        match value {
            Some(v) => println!("{}", v),
            None => {
                eprintln!("Key '{}' not found", key);
                return ExitCode::FAILURE;
            }
        }
    }

    ExitCode::SUCCESS
}

fn set_config(key: &str, value: &str, use_json: bool) -> ExitCode {
    let path = match config_path() {
        Some(p) => p,
        None => {
            if use_json {
                println!(r#"{{"error": "no_config_path"}}"#);
            } else {
                eprintln!("Could not determine config path");
            }
            return ExitCode::FAILURE;
        }
    };

    // Ensure config directory exists
    if let Some(dir) = path.parent() {
        if let Err(e) = fs::create_dir_all(dir) {
            if use_json {
                println!(r#"{{"error": "mkdir_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error creating config directory: {}", e);
            }
            return ExitCode::FAILURE;
        }
    }

    // Load existing config or create new
    let mut config: toml::map::Map<String, toml::Value> = if path.exists() {
        let content = match fs::read_to_string(&path) {
            Ok(c) => c,
            Err(e) => {
                if use_json {
                    println!(r#"{{"error": "read_error", "message": "{}"}}"#, e);
                } else {
                    eprintln!("Error reading config: {}", e);
                }
                return ExitCode::FAILURE;
            }
        };
        let parsed = match content.parse::<toml::Value>() {
            Ok(v) => v,
            Err(e) => {
                if use_json {
                    println!(r#"{{"error": "parse_error", "message": "{}"}}"#, e);
                } else {
                    eprintln!("Error parsing existing config: {}", e);
                }
                return ExitCode::FAILURE;
            }
        };
        match parsed.as_table() {
            Some(table) => table.clone(),
            None => {
                if use_json {
                    println!(r#"{{"error": "invalid_config_format", "message": "Config root must be a TOML table"}}"#);
                } else {
                    eprintln!("Error: existing config must have a TOML table at root");
                }
                return ExitCode::FAILURE;
            }
        }
    } else {
        toml::map::Map::new()
    };

    // Try to parse value as appropriate type
    let parsed_value = if value == "true" {
        toml::Value::Boolean(true)
    } else if value == "false" {
        toml::Value::Boolean(false)
    } else if let Ok(n) = value.parse::<i64>() {
        toml::Value::Integer(n)
    } else if let Ok(f) = value.parse::<f64>() {
        toml::Value::Float(f)
    } else {
        toml::Value::String(value.to_string())
    };

    config.insert(key.to_string(), parsed_value.clone());

    // Write config
    let content = match toml::to_string_pretty(&toml::Value::Table(config)) {
        Ok(c) => c,
        Err(e) => {
            if use_json {
                println!(r#"{{"error": "serialize_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error serializing config: {}", e);
            }
            return ExitCode::FAILURE;
        }
    };
    if let Err(e) = fs::write(&path, content) {
        if use_json {
            println!(r#"{{"error": "write_error", "message": "{}"}}"#, e);
        } else {
            eprintln!("Error writing config: {}", e);
        }
        return ExitCode::FAILURE;
    }

    if use_json {
        let output = ConfigOutput {
            action: Some("set".to_string()),
            key: Some(key.to_string()),
            value: Some(parsed_value.to_string()),
            path: Some(path.display().to_string()),
            config: None,
            error: None,
        };
        return emit_json(&output);
    } else {
        println!("Set {} = {}", key, parsed_value);
    }

    ExitCode::SUCCESS
}

fn reset_config(use_json: bool) -> ExitCode {
    let path = match config_path() {
        Some(p) => p,
        None => {
            if use_json {
                println!(r#"{{"error": "no_config_path"}}"#);
            } else {
                eprintln!("Could not determine config path");
            }
            return ExitCode::FAILURE;
        }
    };

    if path.exists() {
        if let Err(e) = fs::remove_file(&path) {
            if use_json {
                println!(r#"{{"error": "remove_error", "message": "{}"}}"#, e);
            } else {
                eprintln!("Error removing config: {}", e);
            }
            return ExitCode::FAILURE;
        }
    }

    if use_json {
        let output = ConfigOutput {
            action: Some("reset".to_string()),
            key: None,
            value: None,
            path: Some(path.display().to_string()),
            config: None,
            error: None,
        };
        return emit_json(&output);
    } else {
        println!("Config reset (file removed)");
    }

    ExitCode::SUCCESS
}
