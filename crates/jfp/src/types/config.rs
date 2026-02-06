//! Configuration types
//!
//! From EXISTING_JFP_STRUCTURE.md section 3 (Config System)

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Main configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub registry: RegistryConfig,
    pub updates: UpdatesConfig,
    pub skills: SkillsConfig,
    pub output: OutputConfig,
    #[serde(rename = "localPrompts")]
    pub local_prompts: LocalPromptsConfig,
    pub analytics: AnalyticsConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            registry: RegistryConfig::default(),
            updates: UpdatesConfig::default(),
            skills: SkillsConfig::default(),
            output: OutputConfig::default(),
            local_prompts: LocalPromptsConfig::default(),
            analytics: AnalyticsConfig::default(),
        }
    }
}

/// Registry configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryConfig {
    pub url: String,
    pub remote: String,
    #[serde(rename = "manifestUrl")]
    pub manifest_url: String,
    #[serde(rename = "cachePath")]
    pub cache_path: PathBuf,
    #[serde(rename = "metaPath")]
    pub meta_path: PathBuf,
    #[serde(rename = "autoRefresh")]
    pub auto_refresh: bool,
    #[serde(rename = "cacheTtl")]
    pub cache_ttl: u64,
    #[serde(rename = "timeoutMs")]
    pub timeout_ms: u64,
}

impl Default for RegistryConfig {
    fn default() -> Self {
        let config_dir = crate::config::config_dir().unwrap_or_else(|| PathBuf::from("."));
        Self {
            url: "https://jeffreysprompts.com/api/prompts".to_string(),
            remote: "https://jeffreysprompts.com/api/prompts".to_string(),
            manifest_url: "https://jeffreysprompts.com/registry.manifest.json".to_string(),
            cache_path: config_dir.join("registry.json"),
            meta_path: config_dir.join("registry.meta.json"),
            auto_refresh: true,
            cache_ttl: 3600,
            timeout_ms: 2000,
        }
    }
}

/// Update checking configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatesConfig {
    #[serde(rename = "autoCheck")]
    pub auto_check: bool,
    #[serde(rename = "autoUpdate")]
    pub auto_update: bool,
    pub channel: String,
    #[serde(rename = "lastCheck")]
    pub last_check: Option<String>,
    #[serde(rename = "latestKnownVersion")]
    pub latest_known_version: Option<String>,
}

impl Default for UpdatesConfig {
    fn default() -> Self {
        Self {
            auto_check: true,
            auto_update: false,
            channel: "stable".to_string(),
            last_check: None,
            latest_known_version: None,
        }
    }
}

/// Skills installation configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillsConfig {
    #[serde(rename = "personalDir")]
    pub personal_dir: PathBuf,
    #[serde(rename = "projectDir")]
    pub project_dir: PathBuf,
    #[serde(rename = "preferProject")]
    pub prefer_project: bool,
}

impl Default for SkillsConfig {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        Self {
            personal_dir: home.join(".config/claude/skills"),
            project_dir: PathBuf::from(".claude/skills"),
            prefer_project: false,
        }
    }
}

/// Output formatting configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    pub color: bool,
    pub json: bool,
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            color: true,
            json: false,
        }
    }
}

/// Local prompts configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalPromptsConfig {
    pub enabled: bool,
    pub dir: PathBuf,
}

impl Default for LocalPromptsConfig {
    fn default() -> Self {
        let config_dir = crate::config::config_dir().unwrap_or_else(|| PathBuf::from("."));
        Self {
            enabled: true,
            dir: config_dir.join("local"),
        }
    }
}

/// Analytics configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsConfig {
    pub enabled: bool,
}

impl Default for AnalyticsConfig {
    fn default() -> Self {
        Self { enabled: false }
    }
}
