//! Registry loader with SWR caching
//!
//! From EXISTING_JFP_STRUCTURE.md section 6:
//! - Uses ETag with If-None-Match
//! - Cache TTL from config
//! - SWR: if stale and autoRefresh, triggers background refresh

use std::fs;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;
use std::time::Duration;

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use reqwest::blocking::Client;
use reqwest::header::{ACCEPT, ETAG, IF_NONE_MATCH, USER_AGENT};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use super::embedded::bundled_prompts;
use crate::config;
use crate::types::{Prompt, Registry, RegistryLoadResult, RegistrySource};

/// Default cache TTL in seconds
const DEFAULT_CACHE_TTL: u64 = 3600;

/// Default API timeout in milliseconds
const DEFAULT_TIMEOUT_MS: u64 = 2000;

/// Registry API URL
const REGISTRY_URL: &str = "https://jeffreysprompts.com/api/prompts";

/// Cached registry metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CacheMeta {
    #[serde(default)]
    version: Option<String>,
    etag: Option<String>,
    fetched_at: String,
    prompt_count: usize,
}

/// Payload returned by `GET /api/prompts` (we only rely on a few fields).
#[derive(Debug, Deserialize)]
struct RegistryApiPayload {
    #[serde(default)]
    version: Option<String>,
    prompts: Vec<Prompt>,
}

struct RemoteFetchResult {
    /// `None` indicates a 304 Not Modified response.
    prompts: Option<Vec<Prompt>>,
    etag: Option<String>,
    version: Option<String>,
}

/// Registry loader with caching
pub struct RegistryLoader {
    cache_path: PathBuf,
    meta_path: PathBuf,
    cache_ttl: Duration,
    timeout: Duration,
}

impl RegistryLoader {
    /// Create a new registry loader with default paths
    pub fn new() -> Self {
        let config_dir = config::config_dir().unwrap_or_else(|| PathBuf::from("."));
        Self {
            cache_path: config_dir.join("registry.json"),
            meta_path: config_dir.join("registry.meta.json"),
            cache_ttl: Duration::from_secs(DEFAULT_CACHE_TTL),
            timeout: Duration::from_millis(DEFAULT_TIMEOUT_MS),
        }
    }

    /// Create with custom paths (for testing)
    pub fn with_paths(cache_path: PathBuf, meta_path: PathBuf) -> Self {
        Self {
            cache_path,
            meta_path,
            cache_ttl: Duration::from_secs(DEFAULT_CACHE_TTL),
            timeout: Duration::from_millis(DEFAULT_TIMEOUT_MS),
        }
    }

    /// Set cache TTL
    pub fn with_ttl(mut self, ttl: Duration) -> Self {
        self.cache_ttl = ttl;
        self
    }

    /// Set request timeout
    #[allow(dead_code)]
    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    /// Load registry with SWR pattern
    ///
    /// Priority:
    /// 1. Try cache (if fresh)
    /// 2. Try remote (if stale or no cache)
    /// 3. Fall back to bundled
    pub fn load(&self) -> Result<RegistryLoadResult> {
        // Check cache first
        if let Some((prompts, meta)) = self.load_cache()? {
            let stale = self.is_stale(&meta);

            if !stale {
                // Cache is fresh, use it
                return Ok(RegistryLoadResult {
                    registry: Registry::new(prompts),
                    source: RegistrySource::Cache,
                    stale: false,
                });
            }

            // Cache is stale but exists - return stale data
            // In async context, we'd trigger background refresh here
            return Ok(RegistryLoadResult {
                registry: Registry::new(prompts),
                source: RegistrySource::Cache,
                stale: true,
            });
        }

        // No cache - use bundled as fallback
        Ok(RegistryLoadResult {
            registry: Registry::new(bundled_prompts()),
            source: RegistrySource::Bundled,
            stale: false,
        })
    }

    /// Load registry synchronously, attempting remote fetch
    #[allow(dead_code)]
    pub fn load_sync(&self) -> Result<RegistryLoadResult> {
        // Try to load from cache first
        let cached = self.load_cache()?;

        // Check if cache is fresh
        if let Some((prompts, meta)) = &cached {
            if !self.is_stale(meta) {
                return Ok(RegistryLoadResult {
                    registry: Registry::new(prompts.clone()),
                    source: RegistrySource::Cache,
                    stale: false,
                });
            }
        }

        // Cache is stale or missing - try remote
        let etag = cached.as_ref().and_then(|(_, m)| m.etag.as_deref());

        match self.fetch_remote(etag) {
            Ok(remote) => {
                if let Some(prompts) = remote.prompts {
                    // Got new data - save to cache
                    self.save_cache(&prompts, remote.etag, remote.version)?;
                    Ok(RegistryLoadResult {
                        registry: Registry::new(prompts),
                        source: RegistrySource::Remote,
                        stale: false,
                    })
                } else {
                    // 304 Not Modified - cache is still valid
                    if let Some((prompts, _)) = cached {
                        // Update cache timestamp
                        self.touch_cache()?;
                        Ok(RegistryLoadResult {
                            registry: Registry::new(prompts),
                            source: RegistrySource::Cache,
                            stale: false,
                        })
                    } else {
                        // This shouldn't happen (304 without cache)
                        Ok(RegistryLoadResult {
                            registry: Registry::new(bundled_prompts()),
                            source: RegistrySource::Bundled,
                            stale: false,
                        })
                    }
                }
            }
            Err(_) => {
                // Network error - use cache if available, else bundled
                if let Some((prompts, _)) = cached {
                    Ok(RegistryLoadResult {
                        registry: Registry::new(prompts),
                        source: RegistrySource::Cache,
                        stale: true,
                    })
                } else {
                    Ok(RegistryLoadResult {
                        registry: Registry::new(bundled_prompts()),
                        source: RegistrySource::Bundled,
                        stale: false,
                    })
                }
            }
        }
    }

    /// Force refresh from remote
    pub fn refresh(&self) -> Result<RegistryLoadResult> {
        let cached = self.load_cache()?;
        let etag = cached.as_ref().and_then(|(_, m)| m.etag.as_deref());

        match self.fetch_remote(etag) {
            Ok(remote) => {
                if let Some(prompts) = remote.prompts {
                    self.save_cache(&prompts, remote.etag, remote.version)?;
                    Ok(RegistryLoadResult {
                        registry: Registry::new(prompts),
                        source: RegistrySource::Remote,
                        stale: false,
                    })
                } else if let Some((prompts, _)) = cached {
                    // 304 Not Modified - refresh still succeeds using cached data.
                    self.touch_cache()?;
                    Ok(RegistryLoadResult {
                        registry: Registry::new(prompts),
                        source: RegistrySource::Cache,
                        stale: false,
                    })
                } else {
                    // Unexpected 304 without cache
                    self.load()
                }
            }
            Err(e) => {
                // Network error - fall back to cache if available.
                if let Some((prompts, _)) = cached {
                    Ok(RegistryLoadResult {
                        registry: Registry::new(prompts),
                        source: RegistrySource::Cache,
                        stale: true,
                    })
                } else {
                    Err(e)
                }
            }
        }
    }

    /// Load prompts from cache
    fn load_cache(&self) -> Result<Option<(Vec<Prompt>, CacheMeta)>> {
        if !self.cache_path.exists() {
            return Ok(None);
        }

        let file =
            fs::File::open(&self.cache_path).context("Failed to open registry cache")?;
        let reader = BufReader::new(file);
        let prompts: Vec<Prompt> =
            serde_json::from_reader(reader).context("Failed to parse registry cache")?;

        // Load metadata
        let meta = if self.meta_path.exists() {
            let meta_file = fs::File::open(&self.meta_path)?;
            serde_json::from_reader(BufReader::new(meta_file)).unwrap_or_else(|_| CacheMeta {
                version: None,
                etag: None,
                fetched_at: Utc::now().to_rfc3339(),
                prompt_count: prompts.len(),
            })
        } else {
            CacheMeta {
                version: None,
                etag: None,
                fetched_at: Utc::now().to_rfc3339(),
                prompt_count: prompts.len(),
            }
        };

        Ok(Some((prompts, meta)))
    }

    /// Save prompts to cache
    fn save_cache(&self, prompts: &[Prompt], etag: Option<String>, version: Option<String>) -> Result<()> {
        // Ensure directory exists
        if let Some(parent) = self.cache_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Atomic write via temp file
        let temp_path = self.cache_path.with_extension("tmp");
        {
            let file = fs::File::create(&temp_path)?;
            let writer = BufWriter::new(file);
            serde_json::to_writer_pretty(writer, prompts)?;
        }
        fs::rename(&temp_path, &self.cache_path)?;

        // Save metadata
        let meta = CacheMeta {
            version,
            etag,
            fetched_at: Utc::now().to_rfc3339(),
            prompt_count: prompts.len(),
        };

        let temp_meta = self.meta_path.with_extension("tmp");
        {
            let file = fs::File::create(&temp_meta)?;
            let writer = BufWriter::new(file);
            serde_json::to_writer(writer, &meta)?;
        }
        fs::rename(&temp_meta, &self.meta_path)?;

        Ok(())
    }

    /// Update cache timestamp without re-fetching
    fn touch_cache(&self) -> Result<()> {
        if let Ok(file) = fs::File::open(&self.meta_path) {
            if let Ok(mut meta) = serde_json::from_reader::<_, CacheMeta>(BufReader::new(file)) {
                meta.fetched_at = Utc::now().to_rfc3339();

                let temp_meta = self.meta_path.with_extension("tmp");
                {
                    let file = fs::File::create(&temp_meta)?;
                    let writer = BufWriter::new(file);
                    serde_json::to_writer(writer, &meta)?;
                }
                fs::rename(&temp_meta, &self.meta_path)?;
            }
        }
        Ok(())
    }

    /// Check if cache is stale
    fn is_stale(&self, meta: &CacheMeta) -> bool {
        let Ok(fetched) = DateTime::parse_from_rfc3339(&meta.fetched_at) else {
            return true;
        };

        let elapsed = Utc::now().signed_duration_since(fetched);
        elapsed.num_seconds() > self.cache_ttl.as_secs() as i64
    }

    /// Fetch from remote API
    fn fetch_remote(&self, etag: Option<&str>) -> Result<RemoteFetchResult> {
        let client = Client::builder()
            .timeout(self.timeout)
            .build()
            .context("Failed to build registry HTTP client")?;

        let mut req = client
            .get(REGISTRY_URL)
            .header(ACCEPT, "application/json")
            .header(USER_AGENT, format!("jfp/{}", env!("CARGO_PKG_VERSION")));

        if let Some(etag) = etag {
            req = req.header(IF_NONE_MATCH, etag);
        }

        let resp = req.send().context("Failed to fetch registry")?;

        if resp.status() == StatusCode::NOT_MODIFIED {
            return Ok(RemoteFetchResult {
                prompts: None,
                etag: None,
                version: None,
            });
        }

        if !resp.status().is_success() {
            anyhow::bail!("Registry request failed with status {}", resp.status());
        }

        let response_etag = resp
            .headers()
            .get(ETAG)
            .and_then(|value| value.to_str().ok())
            .map(|value| value.to_string());

        let payload: RegistryApiPayload = resp.json().context("Failed to parse registry JSON")?;

        Ok(RemoteFetchResult {
            prompts: Some(payload.prompts),
            etag: response_etag,
            version: payload.version,
        })
    }
}

impl Default for RegistryLoader {
    fn default() -> Self {
        Self::new()
    }
}

/// Get the cache file path
#[allow(dead_code)]
pub fn cache_path() -> PathBuf {
    config::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("registry.json")
}

/// Get the metadata file path
#[allow(dead_code)]
pub fn meta_path() -> PathBuf {
    config::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("registry.meta.json")
}

#[cfg(test)]
mod tests {
    use anyhow::Result;
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_loader_defaults_to_bundled() -> Result<()> {
        let dir = tempdir()?;
        let cache = dir.path().join("registry.json");
        let meta = dir.path().join("registry.meta.json");

        let loader = RegistryLoader::with_paths(cache, meta);
        let result = loader.load()?;

        assert_eq!(result.source, RegistrySource::Bundled);
        assert!(!result.stale);
        assert!(!result.registry.prompts.is_empty());
        Ok(())
    }

    #[test]
    fn test_loader_uses_cache() -> Result<()> {
        let dir = tempdir()?;
        let cache = dir.path().join("registry.json");
        let meta = dir.path().join("registry.meta.json");

        // Write cache
        let prompts = vec![Prompt::new("test-1", "Test One", "Content one")];
        fs::write(&cache, serde_json::to_string(&prompts)?)?;

        let cache_meta = CacheMeta {
            version: None,
            etag: None,
            fetched_at: Utc::now().to_rfc3339(),
            prompt_count: 1,
        };
        fs::write(&meta, serde_json::to_string(&cache_meta)?)?;

        let loader = RegistryLoader::with_paths(cache, meta);
        let result = loader.load()?;

        assert_eq!(result.source, RegistrySource::Cache);
        assert!(!result.stale);
        assert_eq!(result.registry.prompts.len(), 1);
        assert_eq!(result.registry.prompts[0].id, "test-1");
        Ok(())
    }

    #[test]
    fn test_stale_cache_detection() -> Result<()> {
        let dir = tempdir()?;
        let cache = dir.path().join("registry.json");
        let meta = dir.path().join("registry.meta.json");

        // Write cache
        let prompts = vec![Prompt::new("test-1", "Test One", "Content one")];
        fs::write(&cache, serde_json::to_string(&prompts)?)?;

        // Write old metadata (2 hours ago)
        let old_time = Utc::now() - chrono::Duration::hours(2);
        let cache_meta = CacheMeta {
            version: None,
            etag: None,
            fetched_at: old_time.to_rfc3339(),
            prompt_count: 1,
        };
        fs::write(&meta, serde_json::to_string(&cache_meta)?)?;

        let loader = RegistryLoader::with_paths(cache, meta).with_ttl(Duration::from_secs(3600));
        let result = loader.load()?;

        assert_eq!(result.source, RegistrySource::Cache);
        assert!(result.stale);
        Ok(())
    }
}
