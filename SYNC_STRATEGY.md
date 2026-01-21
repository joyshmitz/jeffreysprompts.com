# Sync Strategy

## Source of Truth
- **Primary**: SQLite
- **Rationale**: fast local queries + ACID writes for search/offline use. JSONL remains a human‑readable export and Git‑friendly backup.

## Sync Triggers
- **On command**: `jfp sync` performs the authoritative sync cycle.
- **On exit**: only if a command mutated the offline store (save/notes/collections) and no sync ran.
- **Timer/throttle**: optional background debounce (e.g., 5–10 minutes) to avoid frequent writes; default off.

## Versioning
- **DB marker**: table `sync_meta` with:
  - `schema_version` (u32)
  - `last_synced_at` (ISO 8601)
  - `source_of_truth` = "sqlite"
  - `jsonl_sha256`
  - `record_count`
- **JSONL marker**: `library.meta.json` adjacent to `library.jsonl` with:
  - `schema_version`, `last_synced_at`, `source_of_truth`, `sqlite_sha256`, `record_count`

## Concurrency
- **Lock file path**: `~/.config/jfp/locks/sync.lock`
- **Busy timeout**: 5s (configurable). Use SQLite busy timeout and fs4 lock.

## Failure Handling
- **DB locked**: retry up to timeout; on failure, return non‑zero with clear message.
- **JSONL parse error**: keep DB authoritative; warn + offer `jfp export-jsonl` for recovery.
- **Git commit error**: log warning only; do not fail sync.
