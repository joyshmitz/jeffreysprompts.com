import { test, expect } from "../../lib/playwright-logger";

/**
 * Full Page Visual Regression Tests
 *
 * Captures baseline screenshots of entire pages
 * to detect layout and styling regressions.
 *
 * Note: Full page screenshots may have higher variance
 * due to dynamic content, so maxDiffPixels is higher.
 */

test.describe("Full Page Visual Regression", () => {
  test("Home page - light mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    // Wait for all animations to settle
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-page-light.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Home page light - captured");
  });

  test("Home page - dark mode", async ({ page }) => {
    await page.goto("/");

    // Enable dark mode before content loads
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-page-dark.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Home page dark - captured");
  });

  test("Bundles page - light mode", async ({ page }) => {
    await page.goto("/bundles");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("bundles-page-light.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Bundles page - captured");
  });

  test("Bundles page - dark mode", async ({ page }) => {
    await page.goto("/bundles");

    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("bundles-page-dark.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Bundles page dark - captured");
  });

  test("Workflows page", async ({ page }) => {
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("workflows-page.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Workflows page - captured");
  });

  test("Help page", async ({ page }) => {
    await page.goto("/help");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("help-page.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Help page - captured");
  });

  test("Individual prompt page", async ({ page }) => {
    // Navigate to a specific prompt page
    await page.goto("/prompts/idea-wizard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("prompt-page.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Individual prompt page - captured");
  });

  test("Home page with filters applied", async ({ page }) => {
    await page.goto("/?category=testing");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("home-page-filtered.png", {
      fullPage: true,
      maxDiffPixels: 500,
    });

    console.log("[VISUAL] Home page filtered - captured");
  });

  test("Home page with search query", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    // Open SpotlightSearch and type a query
    await page.keyboard.press("Control+k");
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.fill('[role="dialog"] input', "debugging");
    await page.waitForTimeout(500);

    // Capture the Spotlight with search results visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveScreenshot("spotlight-search-debugging.png", {
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] Spotlight search results - captured");
  });
});

test.describe("Error States", () => {
  test("404 page", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-404");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot("404-page.png", {
      fullPage: true,
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] 404 page - captured");
  });
});
