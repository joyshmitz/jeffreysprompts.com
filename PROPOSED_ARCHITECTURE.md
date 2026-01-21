# PROPOSED_ARCHITECTURE.md

## Overview
Port `jfp` to a Rust workspace with a single binary crate and supporting modules. Preserve CLI UX, add SQLite + JSONL offline storage with explicit sync and recovery commands.

## Workspace Layout
```
crates/
  jfp/
    Cargo.toml
    src/
      main.rs
      cli/
      commands/
      config/
      storage/
      net/
      search/
      export/
      ui/
```

## Crates / Dependencies (proposed)
- CLI + parsing: `clap`
- Serialization: `serde`, `serde_json`, `serde_yaml`
- HTTP: `reqwest` (async)
- SQLite: `rusqlite`
- Sync + locks: `fs4`
- Hashing: `sha2`, `hex`
- Time: `time` or `chrono`
- Temp files: `tempfile`
- TTY / color: `atty`, `owo-colors`

## Data Flow
1. Load config (`~/.config/jfp/config.json`), apply env overrides.
2. Initialize storage (SQLite + JSONL metadata).
3. Load registry cache (SQLite or JSON; remote fetch if stale).
4. Execute command handler (search/show/install/etc).
5. On mutating actions, update SQLite and optionally export JSONL.

## Storage Design
### SQLite (Primary)
- `registry_prompts`: id, title, description, content, category, tags (JSON), author, version, created, updated_at, featured
- `registry_bundles`: id, title, version, prompt_ids (JSON)
- `registry_workflows`: id, title, steps (JSON)
- `saved_prompts`: id, title, content, description, category, tags, saved_at
- `notes`: prompt_id, note_id, content, created_at
- `collections`: id, name, created_at
- `collection_prompts`: collection_id, prompt_id, added_at
- `sync_meta`: schema_version, last_synced_at, source_of_truth, jsonl_sha256, record_count

### JSONL (Backup / Export)
- `~/.config/jfp/library/library.jsonl` for saved prompts
- `~/.config/jfp/library/library.meta.json` for markers

## Sync & Recovery
- Sync is **one‑way** from SQLite to JSONL (default) or reverse via explicit `import-jsonl`.
- Use `fs4` lock file to serialize syncs.
- Use atomic temp file writes with `tempfile::persist()`.
- `jfp db check` exposes `PRAGMA integrity_check`.

## CLI Parser + Command Structure
- `cli/mod.rs` builds clap app; maps to command handlers in `commands/`.
- Each command returns a structured `CommandResult` with:
  - `exit_code`
  - `output_json` (optional)
  - `output_text` (optional)

## Compatibility Targets
- JSON output parity with Bun CLI for `list`, `search`, `show`, `install`, `export`, `status`.
- Error shapes preserved (notably `show` not_found).
- TTY formatting approximates current output (colors optional).

