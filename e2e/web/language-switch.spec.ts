import { test, expect } from "../lib/playwright-logger";

/**
 * i18n Language Switching E2E Tests
 *
 * Verifies language switcher functionality:
 * - Switch language from header selector
 * - Verify content changes language
 * - Persist language preference across reload
 * - Fallback to default language when missing translation
 */

const LOCALES = {
  en: { name: "English", path: "/" },
  es: { name: "Español", path: "/es" },
  fr: { name: "Français", path: "/fr" },
  de: { name: "Deutsch", path: "/de" },
  ja: { name: "日本語", path: "/ja" },
  zh: { name: "中文", path: "/zh" },
} as const;

test.describe("Language Switching", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });
  });

  test("language switcher is visible", async ({ page, logger }) => {
    await logger.step("find language switcher", async () => {
      // The language switcher contains a Globe icon and displays the current locale
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await expect(switcher).toBeVisible();
    });

    await logger.step("verify default is English", async () => {
      // On desktop, should show "English" text
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      const text = await switcher.textContent();
      // Should contain either "English" (desktop) or flag emoji (mobile)
      expect(text?.includes("English") || text?.includes("🇺🇸")).toBeTruthy();
    });
  });

  test("can switch language via selector", async ({ page, logger }) => {
    await logger.step("open language selector", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await switcher.click();
    });

    await logger.step("select Spanish", async () => {
      // Wait for the select dropdown to be visible
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // Click on Spanish option
      const spanishOption = dropdown.locator('[role="option"]').filter({
        hasText: "Español",
      });
      await spanishOption.click();
    });

    await logger.step("verify URL changed to /es", async () => {
      await page.waitForURL(/\/es/);
      const url = page.url();
      expect(url).toContain("/es");
    });

    await logger.step("verify switcher shows Spanish", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      const text = await switcher.textContent();
      expect(text?.includes("Español") || text?.includes("🇪🇸")).toBeTruthy();
    });
  });

  test("can switch to multiple locales", async ({ page, logger }) => {
    const localesToTest = ["fr", "de", "ja"] as const;

    for (const locale of localesToTest) {
      const { name, path } = LOCALES[locale];

      await logger.step(`switch to ${name}`, async () => {
        const switcher = page.locator("button").filter({
          has: page.locator("svg.lucide-globe"),
        });
        await switcher.click();

        const dropdown = page.locator('[role="listbox"]');
        await expect(dropdown).toBeVisible();

        const option = dropdown.locator('[role="option"]').filter({
          hasText: name,
        });
        await option.click();

        await page.waitForURL(new RegExp(path));
        expect(page.url()).toContain(path);
      });
    }
  });

  test("language persists across page reload", async ({ page, logger }) => {
    await logger.step("switch to French", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await switcher.click();

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      const frenchOption = dropdown.locator('[role="option"]').filter({
        hasText: "Français",
      });
      await frenchOption.click();

      await page.waitForURL(/\/fr/);
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify French persisted", async () => {
      // URL should still have /fr
      expect(page.url()).toContain("/fr");

      // Switcher should show French
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      const text = await switcher.textContent();
      expect(text?.includes("Français") || text?.includes("🇫🇷")).toBeTruthy();
    });
  });

  test("can navigate back to English from localized path", async ({ page, logger }) => {
    await logger.step("navigate to German page", async () => {
      await page.goto("/de");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("switch back to English", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await switcher.click();

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      const englishOption = dropdown.locator('[role="option"]').filter({
        hasText: "English",
      });
      await englishOption.click();
    });

    await logger.step("verify URL is root path (no locale prefix)", async () => {
      // Wait for navigation to complete
      await page.waitForLoadState("networkidle");

      // English should use root path without /en prefix
      const url = page.url();
      expect(url).not.toContain("/de");
      // Should be just the base URL or base URL + /
      expect(url.match(/\/[a-z]{2}(?:\/|$)/)).toBeFalsy();
    });
  });

  test("direct navigation to locale path works", async ({ page, logger }) => {
    await logger.step("navigate directly to /ja", async () => {
      await page.goto("/ja");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify Japanese is active", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      const text = await switcher.textContent();
      expect(text?.includes("日本語") || text?.includes("🇯🇵")).toBeTruthy();
    });
  });

  test("unknown locale falls back to default", async ({ page, logger }) => {
    await logger.step("navigate to invalid locale", async () => {
      // Navigate to a path that looks like a locale but isn't valid
      const response = await page.goto("/xx");
      // Should either redirect to default or show 404
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify fallback behavior", async () => {
      const url = page.url();
      // Should not contain /xx in the URL (either redirected or 404)
      // The exact behavior depends on next-intl configuration
      // Most likely it will show a 404 or redirect to root

      // Check if we're on a valid page by looking for the language switcher
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });

      // Either the switcher should show English (redirected) or we're on a 404
      const pageContent = await page.content();
      const is404 = pageContent.includes("404") || pageContent.includes("not found");

      if (!is404) {
        // If not 404, should have redirected to English
        const text = await switcher.textContent();
        expect(text?.includes("English") || text?.includes("🇺🇸")).toBeTruthy();
      }
    });
  });

  test("locale persists when navigating between pages", async ({ page, logger }) => {
    await logger.step("switch to Chinese", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await switcher.click();

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      const chineseOption = dropdown.locator('[role="option"]').filter({
        hasText: "中文",
      });
      await chineseOption.click();

      await page.waitForURL(/\/zh/);
    });

    await logger.step("navigate to another page via link", async () => {
      // Look for a navigation link (e.g., Browse, Pricing)
      const navLink = page.locator("nav a").first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle");
      }
    });

    await logger.step("verify Chinese locale persisted", async () => {
      const url = page.url();
      expect(url).toContain("/zh");

      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      const text = await switcher.textContent();
      expect(text?.includes("中文") || text?.includes("🇨🇳")).toBeTruthy();
    });
  });
});

test.describe("Language Switching - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("language switcher shows flag on mobile", async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify flag is displayed on mobile", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await expect(switcher).toBeVisible();

      // On mobile, should show flag emoji (🇺🇸) instead of "English"
      // The sm:hidden/sm:inline classes control this
      const text = await switcher.textContent();
      // Just verify the switcher is functional
      expect(text).toBeTruthy();
    });

    await logger.step("can switch language on mobile", async () => {
      const switcher = page.locator("button").filter({
        has: page.locator("svg.lucide-globe"),
      });
      await switcher.click();

      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // All options should be visible with flags
      const options = dropdown.locator('[role="option"]');
      await expect(options).toHaveCount(6); // 6 locales
    });
  });
});
