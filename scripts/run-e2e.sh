#!/usr/bin/env bash
# scripts/run-e2e.sh — Comprehensive E2E test orchestration script
#
# Runs all Playwright web specs and CLI E2E tests, collects JSONL logs
# into a single aggregated report, generates an HTML summary, and exits
# with a proper code. Designed for both local development and CI.
#
# Usage:
#   ./scripts/run-e2e.sh                    # Run all tests (chromium)
#   ./scripts/run-e2e.sh --project chromium # Specific Playwright project
#   ./scripts/run-e2e.sh --skip-cli         # Skip CLI tests
#   ./scripts/run-e2e.sh --skip-web         # Skip web tests
#   ./scripts/run-e2e.sh --production       # Use production config
#   E2E_BASE_URL=http://localhost:3001 ./scripts/run-e2e.sh
#
# Environment variables:
#   E2E_BASE_URL        Dev server URL (default: http://localhost:3001)
#   E2E_REPORT_DIR      Output directory (default: e2e-report)
#   E2E_PROJECT         Playwright project (default: chromium)
#   E2E_RETRIES         Retry count (default: 2)
#   E2E_WORKERS         Worker count (default: auto)
#   E2E_VERBOSE         Set to 1 for debug logging
#   CI                  Set in CI environments (reduces workers to 1)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Configuration ---
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:3001}"
E2E_REPORT_DIR="${E2E_REPORT_DIR:-e2e-report}"
E2E_PROJECT="${E2E_PROJECT:-chromium}"
E2E_RETRIES="${E2E_RETRIES:-2}"
E2E_WORKERS="${E2E_WORKERS:-}"
PRODUCTION_MODE=false
SKIP_CLI=false
SKIP_WEB=false
START_SERVER=false
SERVER_PID=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project) E2E_PROJECT="$2"; shift 2 ;;
    --skip-cli) SKIP_CLI=true; shift ;;
    --skip-web) SKIP_WEB=true; shift ;;
    --production) PRODUCTION_MODE=true; shift ;;
    --start-server) START_SERVER=true; shift ;;
    --retries) E2E_RETRIES="$2"; shift 2 ;;
    --workers) E2E_WORKERS="$2"; shift 2 ;;
    --verbose) export E2E_VERBOSE=1; shift ;;
    --help|-h)
      head -20 "$0" | tail -18
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Output setup ---
REPORT_DIR="$PROJECT_ROOT/$E2E_REPORT_DIR"
LOGS_DIR="$REPORT_DIR/logs"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")

rm -rf "$REPORT_DIR"
mkdir -p "$LOGS_DIR"

# --- Helpers ---
log() { echo "[run-e2e] $(date -u +"%H:%M:%S") $*"; }
log_section() { echo ""; echo "═══════════════════════════════════════════════════"; echo "  $*"; echo "═══════════════════════════════════════════════════"; }

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    log "Stopping dev server (PID $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- Track results ---
CLI_EXIT=0
WEB_EXIT=0
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_FLAKY=0
TOTAL_SKIPPED=0

# --- Dev server ---
if [[ "$START_SERVER" == "true" ]]; then
  log_section "Starting dev server"
  log "Starting Next.js dev server on port 3001..."
  cd "$PROJECT_ROOT/apps/web"
  bun run dev --port 3001 > "$LOGS_DIR/dev-server.log" 2>&1 &
  SERVER_PID=$!
  cd "$PROJECT_ROOT"

  log "Waiting for dev server to warm up..."
  DEADLINE=$((SECONDS + 120))
  while [[ $SECONDS -lt $DEADLINE ]]; do
    if curl -sf "$E2E_BASE_URL/" > /dev/null 2>&1; then
      log "Dev server is ready."
      break
    fi
    sleep 2
  done

  if [[ $SECONDS -ge $DEADLINE ]]; then
    log "ERROR: Dev server did not start within 120 seconds."
    exit 1
  fi
fi

# --- CLI E2E Tests ---
if [[ "$SKIP_CLI" == "false" ]]; then
  log_section "CLI E2E Tests"
  log "Running CLI E2E tests..."

  set +e
  E2E_LOG_FILE="$LOGS_DIR/cli-workflow.jsonl" \
    bun test e2e/cli-workflow.test.ts 2>&1 | tee "$LOGS_DIR/cli-stdout.log"
  CLI_EXIT=${PIPESTATUS[0]}
  set -e

  if [[ $CLI_EXIT -eq 0 ]]; then
    log "CLI tests PASSED"
  else
    log "CLI tests FAILED (exit code $CLI_EXIT)"
  fi
fi

# --- Web E2E Tests ---
if [[ "$SKIP_WEB" == "false" ]]; then
  log_section "Web E2E Tests (project: $E2E_PROJECT)"

  PW_CONFIG="e2e/playwright.config.ts"
  if [[ "$PRODUCTION_MODE" == "true" ]]; then
    PW_CONFIG="e2e/playwright.production.config.ts"
  fi

  PW_ARGS=(
    "--config" "$PW_CONFIG"
    "--project" "$E2E_PROJECT"
    "--retries" "$E2E_RETRIES"
    "--reporter" "html,json"
  )

  if [[ -n "$E2E_WORKERS" ]]; then
    PW_ARGS+=("--workers" "$E2E_WORKERS")
  fi

  log "Config: $PW_CONFIG"
  log "Project: $E2E_PROJECT | Retries: $E2E_RETRIES"

  set +e
  PLAYWRIGHT_JSON_OUTPUT_FILE="$REPORT_DIR/playwright-results.json" \
    bunx playwright test "${PW_ARGS[@]}" 2>&1 | tee "$LOGS_DIR/web-stdout.log"
  WEB_EXIT=${PIPESTATUS[0]}
  set -e

  # Parse results from JSON report
  if [[ -f "$REPORT_DIR/playwright-results.json" ]]; then
    TOTAL_PASSED=$(jq '[.suites[].suites[]?.specs[]?.tests[]? | select(.status == "expected")] | length' "$REPORT_DIR/playwright-results.json" 2>/dev/null || echo 0)
    TOTAL_FAILED=$(jq '[.suites[].suites[]?.specs[]?.tests[]? | select(.status == "unexpected")] | length' "$REPORT_DIR/playwright-results.json" 2>/dev/null || echo 0)
    TOTAL_FLAKY=$(jq '[.suites[].suites[]?.specs[]?.tests[]? | select(.status == "flaky")] | length' "$REPORT_DIR/playwright-results.json" 2>/dev/null || echo 0)
    TOTAL_SKIPPED=$(jq '[.suites[].suites[]?.specs[]?.tests[]? | select(.status == "skipped")] | length' "$REPORT_DIR/playwright-results.json" 2>/dev/null || echo 0)
  fi

  if [[ $WEB_EXIT -eq 0 ]]; then
    log "Web tests PASSED ($TOTAL_PASSED passed, $TOTAL_FLAKY flaky, $TOTAL_SKIPPED skipped)"
  else
    log "Web tests FAILED ($TOTAL_PASSED passed, $TOTAL_FAILED failed, $TOTAL_FLAKY flaky)"
  fi
fi

# --- Aggregate JSONL Logs ---
log_section "Aggregating Logs"

# Collect all JSONL logs from test-results/ and /tmp/e2e-logs/
AGGREGATED_LOG="$REPORT_DIR/aggregated-e2e.jsonl"
: > "$AGGREGATED_LOG"

# From test-results (Playwright artifact logs)
if [[ -d test-results ]]; then
  find test-results -name "*.jsonl" -type f | sort | while read -r f; do
    cat "$f" >> "$AGGREGATED_LOG"
  done
fi

# From /tmp/e2e-logs (TestLogger output)
if [[ -d /tmp/e2e-logs ]]; then
  find /tmp/e2e-logs -name "*.jsonl" -type f | sort | while read -r f; do
    cat "$f" >> "$AGGREGATED_LOG"
  done
fi

# From our own logs dir
find "$LOGS_DIR" -name "*.jsonl" -type f | sort | while read -r f; do
  cat "$f" >> "$AGGREGATED_LOG"
done

LOG_LINES=$(wc -l < "$AGGREGATED_LOG" 2>/dev/null || echo 0)
log "Aggregated $LOG_LINES log entries into $AGGREGATED_LOG"

# --- Generate HTML Summary ---
log_section "Generating HTML Report"

HTML_REPORT="$REPORT_DIR/summary.html"

# Extract error entries for the report
ERROR_COUNT=$(grep -c '"level":"error"' "$AGGREGATED_LOG" 2>/dev/null || echo 0)
STEP_COUNT=$(grep -c '"level":"step"' "$AGGREGATED_LOG" 2>/dev/null || echo 0)

# Extract failed step details
FAILED_STEPS=$(grep '"message":"FAIL:' "$AGGREGATED_LOG" 2>/dev/null | head -50 || true)

cat > "$HTML_REPORT" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>E2E Test Report</title>
<style>
  :root { --bg: #0d1117; --card: #161b22; --border: #30363d; --text: #c9d1d9; --green: #3fb950; --red: #f85149; --yellow: #d29922; --blue: #58a6ff; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
  h1 { color: white; margin-bottom: 0.5rem; }
  .meta { color: #8b949e; margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; text-align: center; }
  .stat .value { font-size: 2.5rem; font-weight: 700; }
  .stat .label { color: #8b949e; font-size: 0.875rem; margin-top: 0.25rem; }
  .passed .value { color: var(--green); }
  .failed .value { color: var(--red); }
  .flaky .value { color: var(--yellow); }
  .skipped .value { color: #8b949e; }
  .logs .value { color: var(--blue); }
  .section { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .section h2 { color: white; margin-bottom: 1rem; font-size: 1.25rem; }
  .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
  .badge-pass { background: rgba(63,185,80,0.15); color: var(--green); }
  .badge-fail { background: rgba(248,81,73,0.15); color: var(--red); }
  pre { background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 1rem; overflow-x: auto; font-size: 0.8125rem; line-height: 1.5; color: #e6edf3; white-space: pre-wrap; word-break: break-word; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.5rem 1rem; border-bottom: 1px solid var(--border); }
  th { color: #8b949e; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
  .ok { color: var(--green); } .err { color: var(--red); }
</style>
</head>
<body>
<h1>E2E Test Report</h1>
HTMLEOF

# Inject dynamic data
cat >> "$HTML_REPORT" << EOF
<p class="meta">Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC") | Project: $E2E_PROJECT | Retries: $E2E_RETRIES</p>

<div class="grid">
  <div class="stat passed"><div class="value">$TOTAL_PASSED</div><div class="label">Passed</div></div>
  <div class="stat failed"><div class="value">$TOTAL_FAILED</div><div class="label">Failed</div></div>
  <div class="stat flaky"><div class="value">$TOTAL_FLAKY</div><div class="label">Flaky</div></div>
  <div class="stat skipped"><div class="value">$TOTAL_SKIPPED</div><div class="label">Skipped</div></div>
  <div class="stat logs"><div class="value">$LOG_LINES</div><div class="label">Log Entries</div></div>
</div>

<div class="section">
  <h2>Test Suites</h2>
  <table>
    <tr><th>Suite</th><th>Status</th></tr>
    <tr><td>CLI E2E</td><td>$(if [[ "$SKIP_CLI" == "true" ]]; then echo '<span class="badge">Skipped</span>'; elif [[ $CLI_EXIT -eq 0 ]]; then echo '<span class="badge badge-pass">PASSED</span>'; else echo '<span class="badge badge-fail">FAILED</span>'; fi)</td></tr>
    <tr><td>Web E2E ($E2E_PROJECT)</td><td>$(if [[ "$SKIP_WEB" == "true" ]]; then echo '<span class="badge">Skipped</span>'; elif [[ $WEB_EXIT -eq 0 ]]; then echo '<span class="badge badge-pass">PASSED</span>'; else echo '<span class="badge badge-fail">FAILED</span>'; fi)</td></tr>
  </table>
</div>
EOF

# Add failed steps section if any errors
if [[ "$ERROR_COUNT" -gt 0 ]]; then
  cat >> "$HTML_REPORT" << 'EOF'
<div class="section">
  <h2>Failed Steps</h2>
  <pre>
EOF
  echo "$FAILED_STEPS" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g' >> "$HTML_REPORT"
  cat >> "$HTML_REPORT" << 'EOF'
  </pre>
</div>
EOF
fi

# Add log summary
cat >> "$HTML_REPORT" << EOF
<div class="section">
  <h2>Log Summary</h2>
  <table>
    <tr><th>Metric</th><th>Count</th></tr>
    <tr><td>Total log entries</td><td>$LOG_LINES</td></tr>
    <tr><td>Step entries</td><td>$STEP_COUNT</td></tr>
    <tr><td>Error entries</td><td class="$(if [[ "$ERROR_COUNT" -gt 0 ]]; then echo err; else echo ok; fi)">$ERROR_COUNT</td></tr>
  </table>
</div>

<div class="section">
  <h2>Artifacts</h2>
  <table>
    <tr><th>File</th><th>Description</th></tr>
    <tr><td><code>aggregated-e2e.jsonl</code></td><td>All JSONL logs aggregated</td></tr>
    <tr><td><code>playwright-results.json</code></td><td>Playwright JSON report</td></tr>
    <tr><td><code>logs/</code></td><td>Individual test logs</td></tr>
  </table>
</div>

</body>
</html>
EOF

log "HTML report: $HTML_REPORT"

# --- Final Summary ---
log_section "Summary"
log "CLI:  $(if [[ "$SKIP_CLI" == "true" ]]; then echo SKIPPED; elif [[ $CLI_EXIT -eq 0 ]]; then echo PASSED; else echo FAILED; fi)"
log "Web:  $(if [[ "$SKIP_WEB" == "true" ]]; then echo SKIPPED; elif [[ $WEB_EXIT -eq 0 ]]; then echo PASSED; else echo FAILED; fi)"
log "Results: $TOTAL_PASSED passed, $TOTAL_FAILED failed, $TOTAL_FLAKY flaky, $TOTAL_SKIPPED skipped"
log "Report: $E2E_REPORT_DIR/summary.html"
log "Logs:   $E2E_REPORT_DIR/aggregated-e2e.jsonl ($LOG_LINES entries)"

# Exit with failure if any test suite failed
EXIT_CODE=0
if [[ $CLI_EXIT -ne 0 ]] || [[ $WEB_EXIT -ne 0 ]]; then
  EXIT_CODE=1
fi

exit $EXIT_CODE
