import { test, expect } from "../lib/playwright-logger";
import type { Page } from "@playwright/test";

/**
 * Install Flow E2E Tests
 *
 * Verifies the "Install Skill" functionality from the web UI.
 * Tests the "Terminal Install" button on prompt detail pages.
 */

// Increase timeout for Turbopack streaming stalls
test.setTimeout(60000);

/**
 * Evaluate with resilience to Turbopack execution context destruction.
 * Retries up to `maxRetries` times with 500ms delay between attempts.
 */
async function safeEvaluate<T>(page: Page, fn: () => T | Promise<T>, maxRetries = 5): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await page.evaluate(fn);
    } catch {
      await page.waitForTimeout(500);
    }
  }
  return await page.evaluate(fn);
}

test.describe("Install Skill Flow", () => {
  test.beforeEach(async ({ page, context, logger }) => {
    // Grant clipboard permissions before any page loads
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Install a clipboard spy that persists across execution context recreations.
    // Turbopack streaming can destroy/recreate contexts; addInitScript re-runs
    // in each new context so the spy is always present.
    await page.addInitScript(() => {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = async (text: string) => {
          (window as Record<string, unknown>).__clipboardSpy = text;
          return orig(text);
        };
      }
    });

    await logger.step("warm up browser context", async () => {
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(2000);
    });
  });

  test("can copy install command from prompt detail", async ({ page, logger }) => {
    await logger.step("navigate and wait for hydration", async () => {
      const ratingsReq = page.waitForResponse(
        (resp) => resp.url().includes("/api/ratings"),
        { timeout: 15000 },
      ).catch(() => null);

      await page.goto("/prompts/idea-wizard", { waitUntil: "domcontentloaded" });
      await ratingsReq;
      // Extra settle time for React hydration event handler binding
      await page.waitForTimeout(2000);
    });

    await logger.step("click install button", async () => {
      await page.bringToFront();
      const installButton = page.getByRole("button", { name: /^Install$/i });
      await expect(installButton).toBeVisible({ timeout: 10000 });
      await installButton.click();
      await page.waitForTimeout(2000);
    });

    await logger.step("verify install command", async () => {
      // Check the spy first — it captures the text even if clipboard.writeText throws
      let spyText: string | null = null;
      for (let i = 0; i < 6; i++) {
        try {
          spyText = await page.evaluate(
            () => (window as Record<string, unknown>).__clipboardSpy as string | null,
          );
          if (spyText) break;
        } catch {
          // Context destroyed — retry
        }
        await page.waitForTimeout(500);
      }

      if (spyText) {
        expect(spyText).toContain("curl");
        expect(spyText).toContain("install.sh");
        expect(spyText).toContain("idea-wizard");
      } else {
        // Spy wasn't triggered — try reading clipboard directly
        let clipboardText = "";
        for (let i = 0; i < 6; i++) {
          try {
            clipboardText = await page.evaluate(() => navigator.clipboard.readText());
            if (clipboardText.includes("curl")) break;
          } catch {
            // Context destroyed
          }
          await page.waitForTimeout(500);
        }
        expect(clipboardText).toContain("curl");
      }
    });

    await logger.step("verify copied feedback", async () => {
      const hasFeedback = await safeEvaluate(page, () => {
        const body = document.body.textContent || "";
        return /install command copied/i.test(body) || /copied/i.test(body);
      });
      expect(hasFeedback).toBe(true);
    });
  });

  test("footer shows install command", async ({ page, logger, isMobile }) => {
    test.skip(!!isMobile, "Footer is hidden on mobile");

    await logger.step("scroll to footer", async () => {
      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    });

    await logger.step("find install command block", async () => {
      const codeBlock = page.locator("footer code");
      await expect(codeBlock).toBeVisible({ timeout: 5000 });
      await expect(codeBlock).toContainText("curl");
    });
  });
});
