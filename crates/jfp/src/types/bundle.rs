//! Bundle types
//!
//! From EXISTING_JFP_STRUCTURE.md section 10 (bundles command):
//! JSON with id/title/description/version/promptCount/featured/author

use serde::{Deserialize, Serialize};

/// A bundle of related prompts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bundle {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default, rename = "promptCount")]
    pub prompt_count: usize,
    #[serde(default)]
    pub featured: bool,
    #[serde(default)]
    pub author: Option<String>,
    /// List of prompt IDs in this bundle
    #[serde(default)]
    pub prompts: Vec<String>,
}

impl Bundle {
    pub fn new(id: impl Into<String>, title: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            description: None,
            version: None,
            prompt_count: 0,
            featured: false,
            author: None,
            prompts: Vec::new(),
        }
    }
}

/// Summary view for bundle listing
#[derive(Debug, Serialize)]
pub struct BundleSummary {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(rename = "promptCount")]
    pub prompt_count: usize,
    pub featured: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
}

impl From<&Bundle> for BundleSummary {
    fn from(b: &Bundle) -> Self {
        Self {
            id: b.id.clone(),
            title: b.title.clone(),
            description: b.description.clone(),
            version: b.version.clone(),
            prompt_count: b.prompt_count,
            featured: b.featured,
            author: b.author.clone(),
        }
    }
}
