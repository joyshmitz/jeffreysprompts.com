# PLAN_TO_PORT_JFP_TO_RUST.md

> Port of jfp CLI from Bun/TypeScript to Rust

## Scope

### In Scope (MVP)
- Core commands: list, search, show, categories, tags, about
- SQLite storage with FTS5 for BM25 search
- Bundled prompts as fallback
- JSON and text output modes
- JSONL export/import for backup

### Explicit Exclusions (Phase 1)
- [ ] Auth commands (login, logout, whoami) - requires browser flow
- [ ] Premium commands (save, sync, notes, collections) - requires API
- [ ] Skills commands (install, uninstall, installed, update) - requires file system ops
- [ ] Interactive mode - requires TUI library
- [ ] MCP server (serve command) - requires separate crate
- [ ] Semantic search/reranking - requires ML model

### Future Phases
- Phase 2: Remote API integration, refresh command
- Phase 3: Skills management
- Phase 4: Auth and premium features
- Phase 5: Interactive TUI, MCP server

## Source Documents

| Document | Status | Purpose |
|----------|--------|---------|
| `EXISTING_JFP_STRUCTURE.md` | ✅ Complete | THE SPEC - extracted from legacy |
| `PROPOSED_ARCHITECTURE.md` | N/A | Simple enough to skip |
| `FEATURE_PARITY.md` | ✅ Maintained | Track implementation status |
| `SYNC_STRATEGY.md` | ✅ Complete | SQLite + JSONL sync |
| `RECOVERY_RUNBOOK.md` | ✅ Complete | Disaster recovery |

## Architecture Decisions

### Storage: SQLite over Filesystem
- **Decision**: Use SQLite as primary store, not JSON files
- **Rationale**: FTS5 for search, transactions for ACID, single file
- **Trade-off**: Heavier than JSON, but much faster for search

### Search: FTS5 over Custom BM25
- **Decision**: Use SQLite FTS5 built-in BM25
- **Rationale**: Battle-tested, no external deps, configurable weights
- **Trade-off**: Less control than custom impl, but good enough

### CLI: Clap Derive over Builder
- **Decision**: Use clap derive macros
- **Rationale**: Less boilerplate, compile-time validation
- **Trade-off**: Slightly longer compile times

## Implementation Order

1. ✅ Types module (from spec sections 3-7)
2. ✅ Storage module (SQLite + FTS5)
3. ✅ Registry module (bundled prompts)
4. ✅ Core commands (list, search, show)
5. ✅ Metadata commands (categories, tags, about)
6. ✅ JSONL export/import
7. ✅ All MVP commands (copy, render, export, suggest, config, etc.)
8. ⏳ Remote API integration (Phase 2)

## Conformance Testing (Future)

When implementing API integration:
1. Capture TypeScript CLI outputs as fixtures
2. Compare Rust CLI outputs
3. Verify JSON structure matches
4. Verify error codes match spec

## Performance Targets

| Metric | TypeScript | Rust Target | Achieved |
|--------|------------|-------------|----------|
| Binary size | ~100MB (Bun) | <5MB | ✅ 3.4MB |
| Startup | ~200ms | <10ms | ✅ 2ms |
| Search 1000 prompts | ~50ms | <5ms | TBD |

## Dependencies

```toml
clap = "4"       # CLI framework
rusqlite = "0.32" # SQLite with FTS5
serde = "1"      # Serialization
serde_json = "1" # JSON
chrono = "0.4"   # Time handling
anyhow = "1"     # Error handling
thiserror = "2"  # Error types
directories = "6" # XDG paths
```
