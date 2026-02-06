//! Registry loading and management
//!
//! From EXISTING_JFP_STRUCTURE.md section 6 (Registry Loader)
//! Implements SWR (stale-while-revalidate) caching pattern.

mod loader;
mod embedded;

pub use loader::*;
pub use embedded::*;
