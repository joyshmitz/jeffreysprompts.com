import { test, expect } from "../lib/playwright-logger";

/**
 * Theme Toggling E2E Tests
 *
 * Verifies light/dark mode functionality and persistence.
 */

test.describe("Theme Functionality", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });
  });

  test("can toggle theme", async ({ page, logger }) => {
    await logger.step("find theme toggle", async () => {
      // Look for button containing Sun/Moon/Monitor icons or matching the aria-label pattern
      // The previous locator was too specific on the exact label which might change during hydration
      const toggle = page.locator("button").filter({ has: page.locator("svg.lucide-sun, svg.lucide-moon, svg.lucide-monitor") }).first();
      await expect(toggle).toBeVisible();
    });

    await logger.step("get initial theme", async () => {
      const html = page.locator("html");
      const initialClass = await html.getAttribute("class");
      
      const toggle = page.locator("button").filter({ has: page.locator("svg.lucide-sun, svg.lucide-moon, svg.lucide-monitor") }).first();
      await toggle.click();
      
      // Wait for class change
      await page.waitForTimeout(100);
      
      let newClass = await html.getAttribute("class");
      
      // If no change (might be cycling to system which equals initial), click again
      if (newClass === initialClass) {
        await toggle.click();
        await page.waitForTimeout(100);
        newClass = await html.getAttribute("class");
      }
      
      // One more try
      if (newClass === initialClass) {
        await toggle.click();
        await page.waitForTimeout(100);
        newClass = await html.getAttribute("class");
      }

      expect(newClass).not.toBe(initialClass);
    });
  });

  test("theme persists across reload", async ({ page, logger }) => {
    await logger.step("force dark mode", async () => {
      const html = page.locator("html");
      const isDark = (await html.getAttribute("class"))?.includes("dark");
      
      if (!isDark) {
        const toggle = page.locator("button").filter({ has: page.locator("svg.lucide-sun, svg.lucide-moon, svg.lucide-monitor") }).first();
        await toggle.click();
        // Give it a moment
        await page.waitForTimeout(100);
        
        // If still not dark, click again
        const isDarkNow = (await html.getAttribute("class"))?.includes("dark");
        if (!isDarkNow) {
          await toggle.click();
          await page.waitForTimeout(100);
        }
        
        await expect(html).toHaveClass(/dark/);
      }
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify theme persisted", async () => {
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);
    });
  });
});
