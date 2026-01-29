# FEATURE_PARITY.md

Status key: pending | wip | done | deferred

| Area | Command / Feature | Status | Notes |
| --- | --- | --- | --- |
| Core | jfp (quick-start help) | done | Clap-derived help with all subcommands |
| Core | help | done | Via clap derive |
| Core | list | done | SQLite + FTS5, filters by category/tag/featured |
| Core | search | done | BM25 via SQLite FTS5, weighted fields (id=5, title=3, desc=2, content=1, tags=2) |
| Core | show | done | JSON and text output, --raw for content only |
| Core | copy | pending | |
| Core | render | pending | |
| Core | interactive (i) | pending | |
| Skills | install | pending | |
| Skills | uninstall | pending | |
| Skills | installed | pending | |
| Skills | update | pending | |
| Skills | export | pending | |
| Skills | bundles | pending | |
| Skills | bundle | pending | |
| Skills | skills (list/install/export/create) | pending | |
| Registry | status | pending | |
| Registry | refresh | pending | |
| Registry | categories | done | Dynamic counts from SQLite |
| Registry | tags | done | Dynamic counts from SQLite, sorted by count desc |
| Registry | random | pending | |
| Registry | suggest | pending | |
| Registry | open | pending | |
| Registry | doctor | pending | |
| Registry | about | done | JSON/text output with version and metadata |
| Registry | serve | pending | |
| Auth | login | pending | |
| Auth | logout | pending | |
| Auth | whoami | pending | |
| Premium | save | pending | |
| Premium | sync | pending | |
| Premium | notes | pending | |
| Premium | collections | pending | |
| Tooling | completion | pending | |
| Tooling | config (list/get/set/reset/path) | pending | |
| Tooling | update-cli | pending | |
| Tooling | update-check-internal | pending | |

## Implementation Notes

### Rust Port Architecture (2026-01-28)

The Rust port uses:

1. **Types** (`crates/jfp/src/types/`):
   - `Prompt`, `PromptVariable`, `VariableType` - Core prompt types
   - `Bundle`, `BundleSummary` - Bundle types
   - `Config`, `RegistryConfig`, etc. - Configuration types
   - `Credentials`, `UserTier` - Auth types
   - `Registry`, `RegistryMeta`, `RegistrySource` - Registry types
   - `SearchResult`, `Bm25Weights` - Search types

2. **Storage** (`crates/jfp/src/storage/`):
   - SQLite with WAL mode for concurrent access
   - FTS5 virtual table for full-text search with BM25 ranking
   - Schema version tracking for migrations
   - Denormalized `tags_text` column for FTS indexing

3. **Registry** (`crates/jfp/src/registry/`):
   - Bundled prompts as fallback (8 prompts)
   - SWR-style cache loading (not yet wired to remote API)
   - Cache path: `~/.cache/jfp/registry.json`

4. **Commands** (`crates/jfp/src/commands/`):
   - All commands auto-seed database with bundled prompts if empty
   - JSON output when `--json` flag or stdout is not a TTY
   - Error payloads follow spec patterns

### BM25 Field Weights

From EXISTING_JFP_STRUCTURE.md spec:
- ID: 5x weight
- Title: 3x weight
- Description: 2x weight
- Tags: 2x weight
- Content: 1x weight

### Database Location

- Database: `~/.cache/jfp/jfp.db`
- Uses `directories` crate for cross-platform paths
- Respects `JFP_HOME` environment variable override
