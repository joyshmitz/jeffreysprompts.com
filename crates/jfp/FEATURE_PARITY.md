# Feature Parity Status

> Rust port of jfp CLI - Feature completion status

## Implemented Commands (Phase 1 MVP)

| Command | Status | Notes |
|---------|--------|-------|
| `list` | ✅ Complete | Filter by category, tag, featured |
| `search` | ✅ Complete | FTS5 BM25 search with weighted fields |
| `show` | ✅ Complete | Full prompt details, --raw for content only |
| `copy` | ✅ Complete | Clipboard support, --fill for variables |
| `render` | ✅ Complete | Variable substitution, context files |
| `export` | ✅ Complete | Markdown and skill format |
| `suggest` | ✅ Complete | Task-based recommendations |
| `categories` | ✅ Complete | List with counts |
| `tags` | ✅ Complete | List sorted by count |
| `bundles` | ✅ Complete | Stub with placeholder data |
| `bundle` | ✅ Complete | Stub with placeholder data |
| `random` | ✅ Complete | Filter and clipboard support |
| `config` | ✅ Complete | Get, set, list, reset, path |
| `status` | ✅ Complete | Database and cache status |
| `refresh` | ✅ Complete | Sync with bundled prompts |
| `completion` | ✅ Complete | bash, zsh, fish, powershell, elvish |
| `doctor` | ✅ Complete | Environment diagnostics |
| `open` | ✅ Complete | Open prompt in browser |
| `about` | ✅ Complete | Version and metadata |

## Stub Commands (Planned Features)

| Command | Status | Notes |
|---------|--------|-------|
| `interactive` | ⏳ Stub | TUI mode planned for Phase 5 |
| `update-cli` | ⏳ Stub | Update checking not yet implemented |

## Excluded (Future Phases)

Per PLAN_TO_PORT_JFP_TO_RUST.md:

### Phase 2: Remote API
- [ ] Remote prompt fetching
- [ ] Cache synchronization

### Phase 3: Skills
- [ ] `install` - Install skills
- [ ] `uninstall` - Remove skills
- [ ] `installed` - List installed skills
- [ ] `update` - Update skills

### Phase 4: Auth & Premium
- [ ] `login` - Browser OAuth flow
- [ ] `logout` - Clear credentials
- [ ] `whoami` - Show current user
- [ ] `save` - Save prompts
- [ ] `sync` - Sync with cloud
- [ ] `notes` - Manage notes
- [ ] `collections` - Manage collections

### Phase 5: Advanced
- [ ] `interactive` - Full TUI implementation
- [ ] `serve` - MCP server mode
- [ ] Semantic search

## Storage Layer

| Feature | Status |
|---------|--------|
| SQLite with WAL mode | ✅ |
| FTS5 full-text search | ✅ |
| BM25 weighted fields | ✅ |
| JSONL export/import | ✅ |
| Atomic writes | ✅ |
| Schema versioning | ✅ |

## Test Coverage

- 15 unit tests passing
- Database CRUD operations
- JSONL roundtrip
- Prompt filtering
- Registry loading

## Binary Size & Performance

| Metric | Target | Status |
|--------|--------|--------|
| Binary size | <5MB | TBD (release build) |
| Startup time | <10ms | TBD |
| Search (1000 prompts) | <5ms | TBD |
