//! Core types for the jfp CLI
//!
//! These types are derived from EXISTING_JFP_STRUCTURE.md spec.
//! Do not modify without updating the spec document.

mod prompt;
mod registry;

pub use prompt::*;
pub use registry::*;
