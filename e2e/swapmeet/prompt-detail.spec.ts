import { test, expect } from "../lib/playwright-logger";
import { gotoSwapMeet, gotoSwapMeetPrompt } from "../lib/swapmeet-helpers";

/**
 * Swap Meet Prompt Detail E2E Tests
 */

test.setTimeout(60000);

test.describe("Swap Meet - Prompt Detail", () => {
  test("navigate to detail page from grid", async ({ page, logger }) => {
    await logger.step("open Swap Meet", async () => {
      await gotoSwapMeet(page);
    });

    await logger.step("open specific prompt card", async () => {
      const card = page
        .locator("[data-testid='community-prompt-card']:not([data-featured='true'])")
        .filter({ hasText: "Ultimate Code Review Assistant" })
        .first();
      await card.click();
    });

    await logger.step("verify detail URL", async () => {
      await expect(page).toHaveURL(/\/swap-meet\/comm-1/);
    });

    await logger.step("verify prompt header", async () => {
      await expect(page.getByRole("heading", { level: 1, name: "Ultimate Code Review Assistant" })).toBeVisible();
      await expect(page.getByText("Code Wizard")).toBeVisible();
    });

    await logger.step("verify prompt content section", async () => {
      await expect(page.getByRole("heading", { level: 2, name: "Prompt Content" })).toBeVisible();
      await expect(page.getByText(/Review this code thoroughly/i)).toBeVisible();
    });
  });

  test("invalid prompt shows not found state", async ({ page, logger }) => {
    await logger.step("open invalid prompt id", async () => {
      await gotoSwapMeetPrompt(page, "does-not-exist");
    });

    await logger.step("verify not found message", async () => {
      await expect(page.getByRole("heading", { level: 1, name: "Prompt not found" })).toBeVisible();
      await expect(page.getByText("doesn't exist or has been removed")).toBeVisible();
    });

    await logger.step("verify back link", async () => {
      await expect(page.getByRole("link", { name: "Back to Swap Meet" })).toBeVisible();
    });
  });
});
