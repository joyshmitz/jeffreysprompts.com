# RECOVERY_RUNBOOK.md - jfp CLI

## Quick Diagnosis

```bash
# Check if CLI works
jfp --version

# Check database integrity
jfp doctor --check-db

# Check prompt count
jfp list --json | jq '.count'
```

## Scenario 1: Database Corruption

**Symptoms:**
- `database disk image is malformed`
- `SQLITE_CORRUPT` errors

**Recovery:**

```bash
# 1. Backup corrupted file
cp ~/.cache/jfp/jfp.db ~/.cache/jfp/jfp.db.corrupt

# 2. Try integrity check
sqlite3 ~/.cache/jfp/jfp.db "PRAGMA integrity_check"

# 3. If check fails, remove and rebuild
rm ~/.cache/jfp/jfp.db

# 4. Re-run any command to auto-seed with bundled prompts
jfp list

# 5. If you have a JSONL backup, import it
jfp import-jsonl ~/.cache/jfp/prompts.jsonl
```

## Scenario 2: Missing Database

**Symptoms:**
- Fresh install or cache cleared

**Recovery:**

```bash
# Database auto-creates on first use with bundled prompts
jfp list

# Or import from backup
jfp import-jsonl ~/backup/prompts.jsonl
```

## Scenario 3: Stale Cache

**Symptoms:**
- Prompts seem outdated
- Missing new prompts from registry

**Recovery:**

```bash
# Force refresh from remote
jfp refresh --force

# Or clear and rebuild
rm ~/.cache/jfp/jfp.db
jfp refresh
```

## Scenario 4: Permission Errors

**Symptoms:**
- `SQLITE_CANTOPEN`
- Permission denied

**Recovery:**

```bash
# Check permissions
ls -la ~/.cache/jfp/

# Fix if needed
chmod 755 ~/.cache/jfp
chmod 644 ~/.cache/jfp/jfp.db

# Or use alternate location
JFP_HOME=/tmp/jfp jfp list
```

## Regular Maintenance

```bash
# Weekly: Export backup
jfp export-jsonl ~/Backups/jfp-$(date +%Y%m%d).jsonl

# Monthly: Vacuum database
sqlite3 ~/.cache/jfp/jfp.db "VACUUM"

# After major updates: Analyze for query optimization
sqlite3 ~/.cache/jfp/jfp.db "ANALYZE"
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JFP_HOME` | Override home directory |
| `JFP_DEBUG` | Enable debug logging |
| `JFP_NO_COLOR` | Disable colored output |
