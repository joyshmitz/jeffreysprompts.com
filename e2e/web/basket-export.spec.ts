import { test, expect } from "../lib/playwright-logger";

/**
 * Basket Export E2E Tests
 *
 * Tests for basket export functionality:
 * 1. Download as Markdown (single file and ZIP)
 * 2. Download as Skills ZIP
 * 3. Copy Install Command
 * 4. Clear Basket
 * 5. Toast notifications
 */

test.describe("Basket Export - Markdown Download", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("downloads single prompt as markdown file", async ({ page, logger }) => {
    await logger.step("add a prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("click download as markdown", async () => {
      const downloadButton = page.getByRole("button", { name: /download as markdown/i });
      await expect(downloadButton).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadButton.click(),
      ]);

      // Single prompt downloads as .md file
      expect(download.suggestedFilename()).toMatch(/\.md$/);
    });

    await logger.step("verify success toast", async () => {
      await expect(page.getByText(/downloaded/i).first()).toBeVisible({ timeout: 3000 });
    });
  });

  test("downloads multiple prompts as ZIP file", async ({ page, logger }) => {
    await logger.step("add multiple prompts to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });

      // Add first prompt
      const saveButtons = page.getByRole("button", { name: /save/i });
      await saveButtons.nth(0).click();
      await page.waitForTimeout(100);

      // Add second prompt
      await saveButtons.nth(0).click();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("click download as markdown", async () => {
      const downloadButton = page.getByRole("button", { name: /download as markdown/i });
      await expect(downloadButton).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadButton.click(),
      ]);

      // Multiple prompts download as ZIP
      expect(download.suggestedFilename()).toMatch(/\.zip$/);
    });

    await logger.step("verify success toast shows plural", async () => {
      await expect(page.getByText(/prompts.*exported/i).first()).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe("Basket Export - Skills ZIP Download", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("downloads prompts as skills ZIP", async ({ page, logger }) => {
    await logger.step("add a prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("click download as skills", async () => {
      const downloadButton = page.getByRole("button", { name: /download as skills/i });
      await expect(downloadButton).toBeVisible();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadButton.click(),
      ]);

      // Skills always download as ZIP
      expect(download.suggestedFilename()).toMatch(/skills\.zip$/);
    });

    await logger.step("verify success toast", async () => {
      await expect(page.getByText(/skill.*ready/i).first()).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe("Basket Export - Copy Install Command", () => {
  test.beforeEach(async ({ page, context, logger }) => {
    await logger.step("grant clipboard permissions", async () => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    });

    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("copies install command to clipboard", async ({ page, logger }) => {
    await logger.step("add a prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("click copy install command", async () => {
      const copyButton = page.getByRole("button", { name: /copy install command/i });
      await expect(copyButton).toBeVisible();
      await copyButton.click();
    });

    await logger.step("verify success toast", async () => {
      await expect(page.getByText(/copied/i).first()).toBeVisible({ timeout: 3000 });
    });

    await logger.step("verify clipboard contains jfp install command", async () => {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toMatch(/^jfp install/);
      expect(clipboardText).toContain("idea-wizard");
    });
  });

  test("copies multiple prompt IDs in install command", async ({ page, logger }) => {
    await logger.step("add multiple prompts to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });

      const saveButtons = page.getByRole("button", { name: /save/i });
      await saveButtons.nth(0).click();
      await page.waitForTimeout(100);
      await saveButtons.nth(0).click();
    });

    await logger.step("open basket and copy command", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();

      const copyButton = page.getByRole("button", { name: /copy install command/i });
      await copyButton.click();
    });

    await logger.step("verify clipboard contains multiple IDs", async () => {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toMatch(/^jfp install/);
      // Should contain space-separated IDs
      const ids = clipboardText.replace("jfp install ", "").split(" ");
      expect(ids.length).toBeGreaterThanOrEqual(2);
    });
  });
});

test.describe("Basket Export - Clear Basket", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("clears all items from basket", async ({ page, logger }) => {
    await logger.step("add prompts to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });

      const saveButtons = page.getByRole("button", { name: /save/i });
      await saveButtons.nth(0).click();
      await page.waitForTimeout(100);
      await saveButtons.nth(0).click();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("verify basket has items", async () => {
      // Count should show in basket header
      await expect(page.getByRole("complementary").getByText(/\(2\)/)).toBeVisible();
    });

    await logger.step("click clear basket", async () => {
      const clearButton = page.getByRole("button", { name: /clear basket/i });
      await expect(clearButton).toBeVisible();
      await clearButton.click();
    });

    await logger.step("verify basket is empty", async () => {
      await expect(page.getByText(/your basket is empty/i)).toBeVisible({ timeout: 3000 });
    });

    await logger.step("verify clear toast shown", async () => {
      await expect(page.getByText(/basket cleared/i).first()).toBeVisible({ timeout: 3000 });
    });
  });

  test("export buttons disappear when basket is empty", async ({ page, logger }) => {
    await logger.step("add a prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
    });

    await logger.step("verify export buttons are visible", async () => {
      await expect(page.getByRole("button", { name: /download as markdown/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /download as skills/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /copy install command/i })).toBeVisible();
    });

    await logger.step("clear basket", async () => {
      const clearButton = page.getByRole("button", { name: /clear basket/i });
      await clearButton.click();
    });

    await logger.step("verify export buttons are hidden", async () => {
      await expect(page.getByRole("button", { name: /download as markdown/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /download as skills/i })).not.toBeVisible();
      await expect(page.getByRole("button", { name: /copy install command/i })).not.toBeVisible();
    });
  });
});

test.describe("Basket Export - Remove Individual Items", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("can remove individual item from basket", async ({ page, logger }) => {
    await logger.step("add prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
    });

    await logger.step("open basket sidebar", async () => {
      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("verify item in basket", async () => {
      await expect(page.getByRole("complementary").getByText("The Idea Wizard")).toBeVisible();
    });

    await logger.step("remove item via X button", async () => {
      // Find the X button in the basket item row
      const basketSidebar = page.getByRole("complementary");
      const removeButton = basketSidebar.locator("li").first().getByRole("button");
      await removeButton.click();
    });

    await logger.step("verify basket is now empty", async () => {
      await expect(page.getByText(/your basket is empty/i)).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe("Basket Export - Sidebar Interaction", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage and navigate", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("basket sidebar can be closed with X button", async ({ page, logger }) => {
    await logger.step("add prompt and open basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();

      const basketButton = page.getByRole("button", { name: /open basket/i });
      await basketButton.click();
    });

    await logger.step("verify basket is open", async () => {
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    await logger.step("close basket with X button", async () => {
      // The close button is in the basket header
      const closeButton = page.getByRole("complementary").getByRole("button").first();
      await closeButton.click();
    });

    await logger.step("verify basket is closed", async () => {
      // Basket should slide off-screen (translate-x-full class)
      const sidebar = page.getByRole("complementary");
      await expect(sidebar).toHaveClass(/translate-x-full/, { timeout: 2000 });
    });
  });

  test("basket shows item count in header nav", async ({ page, logger }) => {
    await logger.step("verify initial count is 0 or hidden", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      // Initially basket button may show 0 or be hidden
    });

    await logger.step("add prompt to basket", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
    });

    await logger.step("verify basket button shows count", async () => {
      // The basket button should update to show (1)
      await expect(page.getByRole("button", { name: /basket.*1/i })).toBeVisible({ timeout: 2000 });
    });

    await logger.step("add another prompt", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
    });

    await logger.step("verify count updates to 2", async () => {
      await expect(page.getByRole("button", { name: /basket.*2/i })).toBeVisible({ timeout: 2000 });
    });
  });
});
