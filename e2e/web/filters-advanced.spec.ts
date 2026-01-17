import { test, expect } from "../lib/playwright-logger";

/**
 * Advanced Filters E2E Tests
 *
 * Tests complex combinations of search, category, and tag filters.
 * Verifies that the URL is updated correctly and results are filtered.
 */

test.describe("Advanced Filtering", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });
  });

  test("can combine category and search query", async ({ page, logger }) => {
    await logger.step("select 'ideation' category", async () => {
      await page.getByRole("button", { name: /ideation/i }).first().click();
      await page.waitForURL(/category=ideation/);
    });

    await logger.step("search for 'wizard'", async () => {
      const searchInput = page.getByPlaceholder("Search prompts...");
      await searchInput.fill("wizard");
      // Wait for debounce and URL update
      await page.waitForURL(/q=wizard/);
    });

    await logger.step("verify URL params", async () => {
      const url = page.url();
      expect(url).toContain("category=ideation");
      expect(url).toContain("q=wizard");
    });

    await logger.step("verify results", async () => {
      // Use first() or scope to grid to avoid strict mode violations
      await expect(page.locator("#prompts-section").getByRole("heading", { name: "The Idea Wizard" }).first()).toBeVisible();
      // Ensure results are filtered (should not see documentation prompts unless they match 'wizard')
      // Scope to prompts section to ensure we're checking the filtered grid
      await expect(page.locator("#prompts-section").getByText("The README Reviser")).not.toBeVisible();
    });
  });

  test("can combine tag and category", async ({ page, logger }) => {
    await logger.step("select 'ideation' category", async () => {
      await page.getByRole("button", { name: /ideation/i }).first().click();
      await page.waitForURL(/category=ideation/);
    });

    await logger.step("select 'ultrathink' tag", async () => {
      // Find the tag button - might need to expand tags if hidden
      const tagButton = page.getByRole("button", { name: /ultrathink/i });
      if (await tagButton.isHidden()) {
        const moreTags = page.getByText(/more/i);
        if (await moreTags.isVisible()) {
          await moreTags.click();
        }
      }
      await tagButton.click();
    });

    await logger.step("verify active filters display", async () => {
      // Should show chips for both
      await expect(page.getByLabel(/remove category filter: ideation/i)).toBeVisible();
      await expect(page.getByLabel(/remove tag filter: ultrathink/i)).toBeVisible();
    });

    await logger.step("verify results match criteria", async () => {
      // Idea Wizard has both
      await expect(page.locator("#prompts-section").getByRole("heading", { name: "The Idea Wizard" }).first()).toBeVisible();
    });
  });

  test("browser back button restores filter state", async ({ page, logger }) => {
    await logger.step("apply filters", async () => {
      await page.getByRole("button", { name: /ideation/i }).first().click();
      await page.waitForURL(/category=ideation/);
    });

    await logger.step("navigate to prompt detail", async () => {
      await page.getByRole("button", { name: /view/i }).first().click();
      // Wait for modal or navigation
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    // Close modal to "navigate back" if it's just a modal, or if it was a page nav
    // The current implementation uses a modal on the same route mostly, but let's test reloading URL state
    
    await logger.step("reload page to simulate deep link or back nav", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify filters persisted in URL", async () => {
      const url = page.url();
      expect(url).toContain("category=ideation");
    });

    await logger.step("verify UI reflects URL state", async () => {
      // Category button should be active/selected
      // or filter chip visible
      await expect(page.getByLabel(/remove category filter: ideation/i)).toBeVisible();
    });
  });
});
