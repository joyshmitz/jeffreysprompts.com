# Recovery Runbook

## Symptoms
- SQLite integrity check fails
- JSONL parse failure or missing JSONL
- Version markers mismatch (DB newer than JSONL or vice‑versa)

## Steps
1. **Acquire lock**
   - `~/.config/jfp/locks/sync.lock` (exclusive)
2. **Validate source of truth**
   - If DB passes `PRAGMA integrity_check` and has newer marker → DB is authoritative.
   - If DB corrupted but JSONL valid and newer → JSONL is authoritative.
3. **Rebuild target store**
   - From JSONL → rebuild SQLite.
   - From SQLite → re‑export JSONL.
4. **Update version markers**
   - Write `sync_meta` in DB and `library.meta.json` for JSONL.
5. **Verify counts/hashes**
   - Compare `record_count` + stable hash across stores.
6. **Release lock**

## Commands
- `jfp export-jsonl` → dump SQLite to JSONL
- `jfp import-jsonl` → rebuild SQLite from JSONL
- `jfp db check` → runs `PRAGMA integrity_check`
