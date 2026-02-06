//! Search types
//!
//! From EXISTING_JFP_STRUCTURE.md section 7 (Offline Search Scoring)

use serde::Serialize;

use super::Prompt;

/// Search result with score
#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub prompt: Prompt,
    pub score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub matches: Option<Vec<SearchMatch>>,
}

impl SearchResult {
    pub fn new(prompt: Prompt, score: f64) -> Self {
        Self {
            prompt,
            score,
            matches: None,
        }
    }

    pub fn with_matches(mut self, matches: Vec<SearchMatch>) -> Self {
        self.matches = Some(matches);
        self
    }
}

/// Where a search term matched
#[derive(Debug, Clone, Serialize)]
pub struct SearchMatch {
    pub field: SearchField,
    pub term: String,
}

/// Searchable fields with their weights
///
/// From spec section 7 (Offline Search Scoring):
/// - Title: +10 (prefix +5)
/// - ID: +8
/// - Description: +5
/// - Category: +3
/// - Tag: +2
/// - Content: +1
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SearchField {
    Id,
    Title,
    Description,
    Category,
    Tag,
    Content,
}

impl SearchField {
    /// Base score for this field (from spec)
    pub fn base_score(&self) -> f64 {
        match self {
            SearchField::Title => 10.0,
            SearchField::Id => 8.0,
            SearchField::Description => 5.0,
            SearchField::Category => 3.0,
            SearchField::Tag => 2.0,
            SearchField::Content => 1.0,
        }
    }

    /// Prefix bonus for title matches
    pub fn prefix_bonus(&self) -> f64 {
        match self {
            SearchField::Title => 5.0,
            _ => 0.0,
        }
    }
}

/// BM25 field weights for search
///
/// From spec (implied by search ranking):
/// - ID: 5x weight
/// - Title: 3x weight
/// - Description: 2x weight
/// - Tags: 2x weight
/// - Content: 1x weight
#[derive(Debug, Clone)]
pub struct Bm25Weights {
    pub id: f64,
    pub title: f64,
    pub description: f64,
    pub tags: f64,
    pub content: f64,
}

impl Default for Bm25Weights {
    fn default() -> Self {
        Self {
            id: 5.0,
            title: 3.0,
            description: 2.0,
            tags: 2.0,
            content: 1.0,
        }
    }
}

/// Search options
#[derive(Debug, Clone, Default)]
pub struct SearchOptions {
    pub limit: usize,
    pub weights: Bm25Weights,
    pub include_local: bool,
    pub include_personal: bool,
}

impl SearchOptions {
    pub fn new(limit: usize) -> Self {
        Self {
            limit,
            ..Default::default()
        }
    }
}
