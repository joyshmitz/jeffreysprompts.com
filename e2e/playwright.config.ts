import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for JeffreysPrompts web e2e tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  globalSetup: "./lib/global-setup.ts",
  testDir: ".",
  testMatch: ["web/**/*.spec.ts", "swapmeet/**/*.spec.ts", "docs/**/*.spec.ts", "ratings/**/*.spec.ts", "discovery/**/*.spec.ts", "referral/**/*.spec.ts", "roadmap/**/*.spec.ts", "comments/**/*.spec.ts", "social/**/*.spec.ts", "admin/**/*.spec.ts", "history/**/*.spec.ts"],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry failed tests — Turbopack streaming can intermittently stall */
  retries: process.env.CI ? 2 : 2,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "on-first-retry",

    /* Block service workers to prevent 404 script errors from breaking React hydration */
    serviceWorkers: "block",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    // {
    //   name: "Mobile Safari",
    //   use: { ...devices["iPhone 12"] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "cd ../apps/web && bun run dev --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Next.js startup
  },
});
