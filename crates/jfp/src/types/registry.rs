//! Registry types
//!
//! From EXISTING_JFP_STRUCTURE.md section 6 (Registry Loader)

use serde::{Deserialize, Serialize};

use super::Prompt;

/// Registry metadata for cache management
///
/// From spec section 6:
/// - version, etag, fetchedAt, promptCount
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryMeta {
    pub version: String,
    #[serde(default)]
    pub etag: Option<String>,
    #[serde(rename = "fetchedAt")]
    pub fetched_at: String,
    #[serde(rename = "promptCount")]
    pub prompt_count: usize,
}

impl RegistryMeta {
    pub fn new(prompt_count: usize) -> Self {
        Self {
            version: "1.0.0".to_string(),
            etag: None,
            fetched_at: chrono::Utc::now().to_rfc3339(),
            prompt_count,
        }
    }
}

/// Full registry containing prompts and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Registry {
    pub prompts: Vec<Prompt>,
    #[serde(flatten)]
    pub meta: RegistryMeta,
}

#[allow(dead_code)]
impl Registry {
    pub fn new(prompts: Vec<Prompt>) -> Self {
        let count = prompts.len();
        Self {
            prompts,
            meta: RegistryMeta::new(count),
        }
    }

    /// Find a prompt by ID
    pub fn get(&self, id: &str) -> Option<&Prompt> {
        self.prompts.iter().find(|p| p.id == id)
    }

    /// Get all categories with counts
    pub fn categories(&self) -> Vec<(String, usize)> {
        use std::collections::HashMap;
        let mut counts: HashMap<String, usize> = HashMap::new();
        for prompt in &self.prompts {
            if let Some(cat) = &prompt.category {
                *counts.entry(cat.clone()).or_default() += 1;
            }
        }
        let mut result: Vec<_> = counts.into_iter().collect();
        result.sort_by(|a, b| a.0.cmp(&b.0));
        result
    }

    /// Get all tags with counts
    pub fn tags(&self) -> Vec<(String, usize)> {
        use std::collections::HashMap;
        let mut counts: HashMap<String, usize> = HashMap::new();
        for prompt in &self.prompts {
            for tag in &prompt.tags {
                *counts.entry(tag.clone()).or_default() += 1;
            }
        }
        let mut result: Vec<_> = counts.into_iter().collect();
        result.sort_by(|a, b| b.1.cmp(&a.1)); // Sort by count descending
        result
    }

    /// Filter prompts by category
    pub fn filter_by_category(&self, category: &str) -> Vec<&Prompt> {
        self.prompts
            .iter()
            .filter(|p| p.matches_category(category))
            .collect()
    }

    /// Filter prompts by tag
    pub fn filter_by_tag(&self, tag: &str) -> Vec<&Prompt> {
        self.prompts.iter().filter(|p| p.has_tag(tag)).collect()
    }

    /// Get featured prompts
    pub fn featured(&self) -> Vec<&Prompt> {
        self.prompts.iter().filter(|p| p.featured).collect()
    }
}

/// Source of registry data
#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RegistrySource {
    Remote,
    Cache,
    Bundled,
    Local,
}

/// Registry load result with source info
#[derive(Debug)]
pub struct RegistryLoadResult {
    pub registry: Registry,
    pub source: RegistrySource,
    pub stale: bool,
}
