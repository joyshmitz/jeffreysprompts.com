import { test, expect } from "@playwright/test";

/**
 * Mobile Viewport Visual Regression Tests
 *
 * Tests mobile-specific layouts and components
 * using mobile viewport configurations.
 */

// Mobile viewport settings (iPhone 13-like)
const mobileViewport = { width: 390, height: 844 };

// Tablet viewport settings (iPad-like)
const tabletViewport = { width: 810, height: 1080 };

test.describe("Mobile Visual Regression", () => {
  test("Home page - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-mobile.png", {
      fullPage: true,
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] Home page mobile - captured");
  });

  test("Home page - mobile dark", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");

    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-mobile-dark.png", {
      fullPage: true,
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] Home page mobile dark - captured");
  });

  test("PromptCard - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    // Get first prompt card (SwipeablePromptCard on mobile)
    const card = page.locator('[data-testid="prompt-card"]').first();
    await expect(card).toBeVisible();

    await expect(card).toHaveScreenshot("prompt-card-mobile.png", {
      maxDiffPixels: 100,
    });

    console.log("[VISUAL] PromptCard mobile - captured");
  });

  test("Navigation - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    // Capture the navigation/header area
    const nav = page.locator("nav").first();
    if ((await nav.count()) > 0) {
      await expect(nav).toHaveScreenshot("nav-mobile.png", {
        maxDiffPixels: 100,
      });
      console.log("[VISUAL] Navigation mobile - captured");
    } else {
      console.log("[VISUAL] Navigation mobile - skipped (nav not found)");
    }
  });

  test("SpotlightSearch - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    // On mobile, Spotlight takes full screen
    await page.keyboard.press("Meta+k");
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(300);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveScreenshot("spotlight-mobile.png", {
      maxDiffPixels: 150,
    });

    console.log("[VISUAL] SpotlightSearch mobile - captured");
  });

  test("SpotlightSearch with results - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Meta+k");
    await page.waitForSelector('[role="dialog"]');

    await page.fill('input[type="text"]', "test");
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveScreenshot("spotlight-mobile-results.png", {
      maxDiffPixels: 200,
    });

    console.log("[VISUAL] SpotlightSearch mobile with results - captured");
  });

  test("Bundles page - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/bundles");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("bundles-mobile.png", {
      fullPage: true,
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] Bundles page mobile - captured");
  });

  test("Individual prompt page - mobile", async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    await page.goto("/prompts/idea-wizard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("prompt-page-mobile.png", {
      fullPage: true,
      maxDiffPixels: 300,
    });

    console.log("[VISUAL] Prompt page mobile - captured");
  });
});

test.describe("Tablet Visual Regression", () => {
  test("Home page - tablet", async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-tablet.png", {
      fullPage: true,
      maxDiffPixels: 400,
    });

    console.log("[VISUAL] Home page tablet - captured");
  });
});
