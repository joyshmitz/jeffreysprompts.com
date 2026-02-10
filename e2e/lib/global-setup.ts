/**
 * Global setup for Playwright E2E tests.
 *
 * Warms up the Next.js Turbopack dev server by fetching the homepage
 * and waiting until it returns actual page content. This prevents
 * intermittent blank-page failures caused by requesting pages before
 * the dev server has finished compiling the page bundles.
 */

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";
const MAX_WARMUP_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

export default async function globalSetup() {
  const deadline = Date.now() + MAX_WARMUP_MS;

  // eslint-disable-next-line no-console
  console.log(`[global-setup] Warming up dev server at ${BASE_URL} ...`);

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(10_000) });
      const html = await res.text();

      // Check that the page contains actual rendered content (not just layout shell)
      if (html.includes("data-testid=\"prompt-card\"") || html.includes("Browse All Prompts")) {
        // eslint-disable-next-line no-console
        console.log("[global-setup] Dev server warm — page content detected.");
        return;
      }

      // eslint-disable-next-line no-console
      console.log("[global-setup] Server responded but page content not ready yet, retrying...");
    } catch {
      // eslint-disable-next-line no-console
      console.log("[global-setup] Server not ready, retrying...");
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  // eslint-disable-next-line no-console
  console.warn("[global-setup] Warmup timed out — proceeding anyway.");
}
