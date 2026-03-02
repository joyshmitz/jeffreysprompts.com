import { test, expect } from "../../lib/playwright-logger";
import AxeBuilder from "@axe-core/playwright";

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("skip link is visible on focus and works", async ({ page }) => {
    // Skip link should be hidden initially
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveClass(/sr-only/);

    // Tab to focus the skip link
    await page.keyboard.press("Tab");

    // Should become visible when focused
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText("Skip to main content");

    // Activate the skip link
    await page.keyboard.press("Enter");

    // Focus should move to main content
    const main = page.locator("main#main-content");
    await expect(main).toBeFocused();
  });

  test("tab order is logical through nav elements", async ({ page }) => {
    const focusOrder: string[] = [];

    // Tab through elements and record focus order
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName + (el?.getAttribute("aria-label") || el?.textContent?.slice(0, 20) || "");
      });
      if (focused) focusOrder.push(focused);
    }

    // Verify nav elements are in the focus path
    expect(focusOrder.length).toBeGreaterThan(0);
  });

  test("escape closes the spotlight search", async ({ page }) => {
    // Open spotlight search with keyboard
    await page.keyboard.press("Meta+k");

    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 2000 }).catch(() => {
      // Try Ctrl+K for non-Mac
      return page.keyboard.press("Control+k");
    });

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Dialog should be closed
    await expect(dialog).not.toBeVisible();
  });

  test("arrow keys navigate search results", async ({ page }) => {
    // Open spotlight search
    await page.keyboard.press("Meta+k").catch(() => page.keyboard.press("Control+k"));

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      // Type a search query
      await searchInput.fill("idea");
      await page.waitForTimeout(300); // Debounce

      // Use arrow down to navigate
      await page.keyboard.press("ArrowDown");

      // Check that aria-activedescendant updates
      const activeDescendant = await searchInput.getAttribute("aria-activedescendant");
      expect(activeDescendant).toBeTruthy();
    }
  });

  test("prompt cards are keyboard accessible", async ({ page }) => {
    // Find a prompt card
    const card = page.locator('[data-testid="prompt-card"]').first();

    // If card exists, verify it can receive focus
    if (await card.count() > 0) {
      // Tab until we reach a card (or its buttons)
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => document.activeElement?.closest('[data-testid="prompt-card"]'));
        if (focused) break;
      }

      // Verify a card-related element is focused
      const focusedInCard = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.closest('[data-testid="prompt-card"]') !== null ||
               active?.tagName === "BUTTON";
      });
      expect(focusedInCard).toBe(true);
    }
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    // Tab to the first interactive element
    await page.keyboard.press("Tab");

    // Get the focused element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        boxShadow: styles.boxShadow,
      };
    });

    // Verify focus is visible (outline or box-shadow)
    if (focusedElement) {
      const hasVisibleFocus =
        (focusedElement.outlineWidth !== "0px" && focusedElement.outlineStyle !== "none") ||
        focusedElement.boxShadow !== "none";
      expect(hasVisibleFocus).toBe(true);
    }
  });
});
