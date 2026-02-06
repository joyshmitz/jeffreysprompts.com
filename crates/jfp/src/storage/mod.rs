//! SQLite storage layer
//!
//! From rust-cli-with-sqlite skill:
//! - SQLite = fast, ACID, primary for reads/writes
//! - WAL mode for concurrent access
//! - Atomic writes with transactions
//! - JSONL for backup/export

mod database;
mod jsonl;
mod schema;

pub use database::*;
pub use schema::*;
