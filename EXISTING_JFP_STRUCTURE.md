# EXISTING_JFP_STRUCTURE.md

> Spec extracted from current Bun/TypeScript CLI (`jfp.ts`, `packages/cli`).
> This document is the source of truth for Rust parity. Do not re‑interpret behavior during implementation.

## 1) Entry Points and Layout
- **Entry**: `jfp.ts`
  - Calls `checkForUpdatesInBackground()` then `cli.parse()` from `packages/cli/src/index.ts`.
- **CLI framework**: `cac` (command + options + action handlers).
- **Primary code**: `packages/cli/src/` with `commands/` and `lib/`.

## 2) Output and Error Conventions
- **JSON output** if `--json` OR `!process.stdout.isTTY`.
- **Color disable** if `--no-color` or `NO_COLOR` or `JFP_NO_COLOR`.
- **Safe skill IDs**: `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$` (must start/end with alnum; hyphens allowed inside).
- Many commands use `process.exit(1)` on errors; no global error mapping.

### Show Error Shape (stable)
- `show <id>` when not found: **JSON** only `{ "error": "not_found" }` (no message field).

## 3) Config (defaults + env overrides)
File: `packages/cli/src/lib/config.ts`

### Paths
- Config dir: `~/.config/jfp` (or `JFP_HOME` overrides home)
- Config file: `~/.config/jfp/config.json`
- Registry cache: `~/.config/jfp/registry.json`
- Registry meta: `~/.config/jfp/registry.meta.json`
- Local prompts dir: `~/.config/jfp/local`
- Skills personal dir: `~/.config/claude/skills`
- Skills project dir: `.claude/skills`

### Defaults
```
registry:
  url: https://jeffreysprompts.com/api/prompts
  remote: https://jeffreysprompts.com/api/prompts
  manifestUrl: https://jeffreysprompts.com/registry.manifest.json
  cachePath: ~/.config/jfp/registry.json
  metaPath: ~/.config/jfp/registry.meta.json
  autoRefresh: true
  cacheTtl: 3600
  timeoutMs: 2000
updates:
  autoCheck: true
  autoUpdate: false
  channel: stable
  lastCheck: null
  latestKnownVersion: null
skills:
  personalDir: ~/.config/claude/skills
  projectDir: .claude/skills
  preferProject: false
output:
  color: true
  json: false
localPrompts:
  enabled: true
  dir: ~/.config/jfp/local
analytics:
  enabled: false
```

### Env overrides
- `JFP_REGISTRY_URL` overrides registry url + remote
- `JFP_CACHE_TTL` overrides TTL (int)
- `JFP_NO_COLOR` disables color

## 4) Credentials + Auth
File: `packages/cli/src/lib/credentials.ts`

### Storage
- Path: `${XDG_CONFIG_HOME|HOME}/jfp/credentials.json`
- Directory perms: `0700`, file perms `0600`.

### Schema (Zod)
```
access_token: string
refresh_token?: string
expires_at: string (ISO 8601)
email: string (email format)
tier: "free" | "premium"
user_id: string
```

### Token refresh
- Refresh endpoint: `${JFP_PREMIUM_URL || https://pro.jeffreysprompts.com}/api/cli/token/refresh`
- Body: `{ refresh_token, client_id: "jfp-cli" }`
- Expiry buffer: 5 minutes (token treated expired 5m early).

### Env override
- `JFP_TOKEN` bypasses file and supplies token directly (no user info).

## 5) API Client
File: `packages/cli/src/lib/api-client.ts`

- Base URL: `JFP_PREMIUM_API_URL` or `https://pro.jeffreysprompts.com/api`.
- Timeout: 30s default.
- Adds `Authorization: Bearer <token>` if available.
- Parses JSON only when `Content-Type` includes `application/json`.
- Error message uses `error` or `message` field; falls back to statusText.

## 6) Registry Loader
File: `packages/cli/src/lib/registry-loader.ts`

- **SWR** pattern:
  - If cache exists: return cached immediately.
  - If stale and `autoRefresh=true`, refresh in background.
  - If no cache: fetch remote; fall back to bundled prompts.
- **ETag** support with `If-None-Match`.
- **Cache freshness**: `cacheTtl` seconds.
- **Local prompts**: if enabled, read JSON files from `localPrompts.dir`.
  - Accepts either a single prompt object or array of prompts per file.
  - Zod validation; warns if invalid but has `id`.
- **Offline prompts**: from `library/prompts.json` (see Offline Library).
- Merge order: offline → cached/remote → local.

## 7) Offline Library (current JSON storage)
File: `packages/cli/src/lib/offline.ts`

### Paths
- Library dir: `~/.config/jfp/library`
- Prompts file: `~/.config/jfp/library/prompts.json`
- Sync meta: `~/.config/jfp/library/sync.meta.json`

### Types
```
SyncedPrompt:
  id, title, content, description?, category?, tags?, saved_at
SyncMeta:
  lastSync, promptCount, version
```

### Online check
- HEAD to `https://jeffreysprompts.com/api/health`, timeout 3000ms.
- Cached for 10s.

### Offline search scoring
- title contains: +10 (prefix +5)
- id contains: +8
- description contains: +5
- category contains: +3
- tag contains: +2
- content contains: +1

## 8) Skills Manifest
File: `packages/cli/src/lib/manifest.ts`

- `manifest.json` stored alongside skills dir.
- `FullSkillManifest` adds `generatedAt` and `jfpVersion` to `SkillManifest`.
- Atomic writes (temp + rename).
- Detects user modification by:
  - YAML frontmatter `x_jfp_generated: true`
  - Hash comparison using `computeSkillHash`.

## 9) Commands (surface + options)
All commands are defined in `packages/cli/src/index.ts`.

### Core
- `list` `--category` `--tag` `--mine` `--saved` `--json`
- `search <query>` `--limit` `--mine` `--saved` `--all` `--local` `--json`
- `show <id>` `--json` `--raw`
- `copy <id>` `--fill` `--json`
- `render <id>` `--fill` `--context <path>` `--stdin` `--max-context <bytes>` `--json`

### Skills + Export
- `install [...ids]` `--project` `--all` `--bundle <id>` `--force` `--json`
- `uninstall [...ids]` `--project` `--confirm` `--json`
- `export [...ids]` `--format <skill|md>` `--output-dir <dir>` `--all` `--stdout` `--json`
- `installed` `--personal` `--project` `--json`
- `update` `--personal` `--project` `--dry-run` `--diff` `--force` `--json`
- `bundles` `--json`
- `bundle <id>` `--json`
- `skills` subcommands via `skills` command (list/install/export/create)

### Registry + Info
- `status` `--json`
- `refresh` `--json`
- `categories` `--json`
- `tags` `--json`
- `open` `--json`
- `doctor` `--json`
- `about` `--json`
- `random` `--json`
- `help`
- `serve` (CLI server mode)
- `completion --shell <bash|zsh|fish>`

### Auth + Premium
- `login` `--remote` `--timeout <ms>` `--json`
- `logout` `--revoke` `--json`
- `whoami` `--json`
- `save <prompt-id>` `--json`
- `sync` `--force` `--status` `--json`
- `notes <prompt-id>` `--add <text>` `--delete <note-id>` `--json`
- `collections [action] [name] [promptId]` `--add <prompt-id>` `--export`

## 10) Validations / Default Values
- `search --limit`: must be positive number; else exit 1.
- Skill/bundle id safety: `isSafeSkillId` regex.
- `show`: not found -> exit 1 + JSON error `{"error":"not_found"}`.
- Credentials: `expires_at` required; refresh uses 5m buffer.

## 11) SQL Queries
- **None** (current CLI uses JSON files and HTTP APIs only).
