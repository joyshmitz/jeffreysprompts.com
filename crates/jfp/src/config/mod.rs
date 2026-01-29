//! Configuration management

use directories::ProjectDirs;
use std::path::PathBuf;

/// Get the configuration directory path
pub fn config_dir() -> Option<PathBuf> {
    // Check for JFP_HOME override
    if let Ok(home) = std::env::var("JFP_HOME") {
        return Some(PathBuf::from(home).join(".config").join("jfp"));
    }

    // Use standard directories
    ProjectDirs::from("com", "jeffreysprompts", "jfp")
        .map(|dirs| dirs.config_dir().to_path_buf())
}

/// Get the cache directory path
pub fn cache_dir() -> Option<PathBuf> {
    // Check for JFP_HOME override (same as config_dir for consistency)
    if let Ok(home) = std::env::var("JFP_HOME") {
        return Some(PathBuf::from(home).join(".cache").join("jfp"));
    }

    // Use standard directories
    ProjectDirs::from("com", "jeffreysprompts", "jfp")
        .map(|dirs| dirs.cache_dir().to_path_buf())
}
