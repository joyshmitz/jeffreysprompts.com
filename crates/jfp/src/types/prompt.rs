//! Prompt types
//!
//! From EXISTING_JFP_STRUCTURE.md section 7:
//! SyncedPrompt: { id, title, content, description?, category?, tags?, saved_at }

use serde::{Deserialize, Serialize};

/// Variable definition within a prompt template
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PromptVariable {
    pub name: String,
    #[serde(rename = "type", default)]
    pub var_type: VariableType,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub default: Option<String>,
}

/// Variable types supported by prompts
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum VariableType {
    #[default]
    Text,
    Multiline,
    File,
    Path,
    Select,
}

/// Core prompt structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub content: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub variables: Vec<PromptVariable>,
    #[serde(default)]
    pub featured: bool,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    /// For synced/saved prompts
    #[serde(default)]
    pub saved_at: Option<String>,
    /// Local prompt indicator
    #[serde(default)]
    pub is_local: bool,
}

impl Prompt {
    /// Create a new prompt with required fields
    pub fn new(id: impl Into<String>, title: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            content: content.into(),
            description: None,
            category: None,
            tags: Vec::new(),
            variables: Vec::new(),
            featured: false,
            version: None,
            author: None,
            saved_at: None,
            is_local: false,
        }
    }

    /// Get content preview (first N lines)
    #[allow(dead_code)]
    pub fn preview(&self, lines: usize) -> String {
        self.content
            .lines()
            .take(lines)
            .collect::<Vec<_>>()
            .join("\n")
    }

    /// Check if prompt matches a category filter
    pub fn matches_category(&self, category: &str) -> bool {
        self.category
            .as_ref()
            .is_some_and(|c| c.eq_ignore_ascii_case(category))
    }

    /// Check if prompt has a specific tag
    pub fn has_tag(&self, tag: &str) -> bool {
        self.tags.iter().any(|t| t.eq_ignore_ascii_case(tag))
    }
}

/// Summary view of a prompt for list output
#[derive(Debug, Serialize)]
pub struct PromptSummary {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    pub featured: bool,
}

impl From<&Prompt> for PromptSummary {
    fn from(p: &Prompt) -> Self {
        Self {
            id: p.id.clone(),
            title: p.title.clone(),
            description: p.description.clone(),
            category: p.category.clone(),
            tags: p.tags.clone(),
            featured: p.featured,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_new() {
        let p = Prompt::new("test-id", "Test Title", "Test content");
        assert_eq!(p.id, "test-id");
        assert_eq!(p.title, "Test Title");
        assert_eq!(p.content, "Test content");
        assert!(!p.featured);
        assert!(p.tags.is_empty());
    }

    #[test]
    fn test_matches_category() {
        let mut p = Prompt::new("id", "title", "content");
        p.category = Some("Testing".to_string());
        assert!(p.matches_category("testing"));
        assert!(p.matches_category("Testing"));
        assert!(!p.matches_category("other"));
    }

    #[test]
    fn test_has_tag() {
        let mut p = Prompt::new("id", "title", "content");
        p.tags = vec!["rust".to_string(), "CLI".to_string()];
        assert!(p.has_tag("rust"));
        assert!(p.has_tag("cli"));
        assert!(!p.has_tag("python"));
    }
}
