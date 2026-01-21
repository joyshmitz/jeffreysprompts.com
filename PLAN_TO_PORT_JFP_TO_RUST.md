# PLAN_TO_PORT_JFP_TO_RUST.md

## Goal
Port the `jfp` CLI from Bun/TypeScript to an idiomatic Rust CLI while preserving user‑visible behavior, JSON/TTY output modes, and premium API integrations. Add a robust SQLite + JSONL offline store with explicit sync/recovery tooling.

## Scope
- **In scope**: CLI behavior, commands, config, auth, registry cache, offline library, search, skills install/update, bundles/workflows, update‑check, completion, and error semantics.
- **Out of scope**: Next.js web app, server/API implementation, UI components, prompts registry authoring tooling, Vercel/Cloudflare config, deployment scripts.

## Explicit Exclusions
- No changes to the existing Bun/TS CLI during the Rust port (kept as reference baseline).
- No new product features beyond parity unless explicitly requested.
- No web app migration to Rust.

## Phases
### Phase 1 — Planning (this phase)
- Create spec docs: `EXISTING_JFP_STRUCTURE.md`, `PROPOSED_ARCHITECTURE.md`.
- Create sync docs: `SYNC_STRATEGY.md`, `RECOVERY_RUNBOOK.md`.
- Establish feature parity checklist: `FEATURE_PARITY.md`.

### Phase 2 — Spec Extraction
- Deep‑dive each CLI subsystem, capturing:
  - Data structures and default values
  - Validation rules (exact conditions)
  - Network endpoints and timeouts
  - Error shapes and exit codes
- Document any gaps/ambiguities.

### Phase 3 — Architecture Synthesis
- Rust workspace layout
- Module boundaries
- SQLite schema + JSONL export format
- Concurrency + locking plan

### Phase 4 — Implementation
- Skeleton crate + command parser (clap)
- Config + credentials
- Registry cache + offline store
- Search + suggestion
- Skill install/update + manifest
- Auth flows + API client
- Update check + completion

### Phase 5 — Conformance & QA
- Add conformance tests vs Bun CLI outputs
- Validate JSON/TTY parity
- Validate SQLite + JSONL recovery

## Target Outputs
- `crates/jfp/` (Rust CLI) with `jfp` binary
- Parity across all documented CLI commands
- Robust offline storage and deterministic sync

## Open Questions
- Confirm desired **primary source of truth** for offline data (default: SQLite).
- Confirm whether Rust CLI should **replace** or **coexist** with Bun CLI (default: coexist).

## Acceptance Criteria
- All CLI commands documented in `EXISTING_JFP_STRUCTURE.md`
- `SYNC_STRATEGY.md` and `RECOVERY_RUNBOOK.md` completed
- Rust CLI reaches parity with Bun CLI outputs (JSON + TTY)
- Sync + recovery validated (integrity checks + count/hash)
