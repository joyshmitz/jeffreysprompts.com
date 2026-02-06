//! Credentials types
//!
//! From EXISTING_JFP_STRUCTURE.md section 4 (Credentials and Auth)

use serde::{Deserialize, Serialize};

/// User tier level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum UserTier {
    #[default]
    Free,
    Premium,
}

impl UserTier {
    pub fn is_premium(&self) -> bool {
        matches!(self, UserTier::Premium)
    }
}

/// Stored credentials
///
/// From spec section 4:
/// - access_token: string
/// - refresh_token?: string
/// - expires_at: string (ISO 8601)
/// - email: string
/// - tier: "free" | "premium"
/// - user_id: string
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credentials {
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
    pub expires_at: String,
    pub email: String,
    #[serde(default)]
    pub tier: UserTier,
    pub user_id: String,
}

impl Credentials {
    /// Check if credentials are expired (with 5-minute buffer)
    pub fn is_expired(&self) -> bool {
        use chrono::{DateTime, Duration, Utc};

        let Ok(expires) = DateTime::parse_from_rfc3339(&self.expires_at) else {
            return true; // Invalid date = expired
        };

        let buffer = Duration::minutes(5);
        Utc::now() >= expires - buffer
    }

    /// Check if user has premium tier
    pub fn is_premium(&self) -> bool {
        self.tier.is_premium()
    }
}

/// Authentication status for command output
#[derive(Debug, Serialize)]
pub struct AuthStatus {
    pub authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tier: Option<UserTier>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    pub source: AuthSource,
}

/// Source of authentication
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AuthSource {
    None,
    File,
    Environment,
}

impl Default for AuthStatus {
    fn default() -> Self {
        Self {
            authenticated: false,
            email: None,
            tier: None,
            expires_at: None,
            source: AuthSource::None,
        }
    }
}

impl From<&Credentials> for AuthStatus {
    fn from(creds: &Credentials) -> Self {
        Self {
            authenticated: true,
            email: Some(creds.email.clone()),
            tier: Some(creds.tier),
            expires_at: Some(creds.expires_at.clone()),
            source: AuthSource::File,
        }
    }
}
