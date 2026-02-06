# SYNC_STRATEGY.md - jfp CLI

## Source of Truth

**SQLite is the primary source of truth.**

Rationale:
- Fast queries via FTS5 for BM25 search
- ACID writes for prompt CRUD
- Single-file distribution
- JSONL is for backup/export only

## Sync Direction

```
SQLite (primary) ──export──> JSONL (backup)
SQLite (primary) <──import── JSONL (restore)
```

One-way sync only. Never merge.

## Sync Triggers

| Trigger | Action |
|---------|--------|
| `jfp export-jsonl` | Manual export SQLite → JSONL |
| `jfp import-jsonl` | Manual import JSONL → SQLite |
| `jfp refresh` | Fetch remote → SQLite (future) |

No automatic sync. User controls when backup happens.

## Version Markers

### SQLite
```sql
INSERT INTO registry_meta (key, value) VALUES
  ('data_version', '2026-01-28T12:00:00Z'),
  ('schema_version', '2');
```

### JSONL
First line is metadata:
```json
{"_meta": {"version": "2026-01-28T12:00:00Z", "count": 42, "exported_at": "..."}}
```

## Lock Strategy

- SQLite: WAL mode handles concurrent reads
- JSONL export: Use temp file + atomic rename
- No cross-process lock needed (single-user CLI)

## Paths

| Store | Path |
|-------|------|
| SQLite | `~/.cache/jfp/jfp.db` |
| JSONL export | `~/.cache/jfp/prompts.jsonl` |
| Registry cache | `~/.config/jfp/registry.json` |

## Failure Handling

| Scenario | Action |
|----------|--------|
| Export interrupted | Old JSONL preserved (atomic rename) |
| Import fails | SQLite unchanged (transaction rollback) |
| DB corruption | `PRAGMA integrity_check`, rebuild from JSONL |
| JSONL corrupt | Error message, no action taken |

## Recovery Commands

```bash
# Export current state
jfp export-jsonl ~/.cache/jfp/prompts.jsonl

# Import from backup
jfp import-jsonl ~/.cache/jfp/prompts.jsonl

# Verify integrity
jfp doctor --check-db
```
