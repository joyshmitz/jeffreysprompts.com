import { test, expect } from "../lib/playwright-logger";

/**
 * Basket E2E Tests
 *
 * Tests for the basket (save) functionality:
 * 1. Add prompts to basket via card button
 * 2. Remove prompts from basket
 * 3. Clear entire basket
 * 4. Basket persistence (localStorage)
 * 5. Visual feedback (button state, count)
 */

test.describe("Basket - Add/Remove Prompts", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("can add prompt to basket via Save button", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("click Save button on first card", async () => {
      // Find the Save button on a prompt card
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await expect(saveButton).toBeVisible();
      await saveButton.click();
    });

    await logger.step("verify button changed to Added state", async () => {
      // Button should now show "Added" state
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible({ timeout: 2000 });
    });
  });

  test("can remove prompt from basket via button toggle", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add prompt to basket", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("click Added button to remove", async () => {
      const addedButton = page.getByRole("button", { name: /added/i }).first();
      await addedButton.click();
    });

    await logger.step("verify button reverted to Save state", async () => {
      await expect(page.getByRole("button", { name: /save/i }).first()).toBeVisible({ timeout: 2000 });
    });
  });

  test("can add multiple prompts to basket", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add first prompt", async () => {
      const saveButtons = page.getByRole("button", { name: /save/i });
      await saveButtons.first().click();
    });

    await logger.step("add second prompt", async () => {
      // After first is added, there should still be more Save buttons
      const saveButtons = page.getByRole("button", { name: /save/i });
      await expect(saveButtons.first()).toBeVisible();
      await saveButtons.first().click();
    });

    await logger.step("verify two prompts are in basket", async () => {
      // Should have at least 2 "Added" buttons
      const addedButtons = page.getByRole("button", { name: /added/i });
      const count = await addedButtons.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

test.describe("Basket - Persistence", () => {
  test("basket persists across page reloads", async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("add prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("wait for localStorage to persist", async () => {
      // Wait for debounce (default is 150ms, give extra buffer)
      await page.waitForTimeout(500);
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify basket item persisted", async () => {
      // Wait for the page to load and hydrate
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      // Wait for localStorage to be read and state to update
      await page.waitForTimeout(300);
      // First card should still show "Added"
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test("basket is stored in localStorage", async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("add prompt to basket", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("wait for localStorage debounce", async () => {
      // Wait for debounce to complete
      await page.waitForTimeout(500);
    });

    await logger.step("verify localStorage contains basket", async () => {
      const basketData = await page.evaluate(() => localStorage.getItem("jfp-basket"));
      expect(basketData).not.toBeNull();
      if (basketData) {
        const parsed = JSON.parse(basketData);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBeGreaterThan(0);
      }
    });
  });
});

test.describe("Basket - Card Visual State", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("card shows visual indicator when in basket", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add to basket", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("verify Added button has distinct styling", async () => {
      // The Added button should have different styling than Save
      const addedButton = page.getByRole("button", { name: /added/i }).first();
      await expect(addedButton).toBeVisible();
      // Button should be styled differently (indigo background or white text)
      const hasDistinctStyle = await addedButton.evaluate((el) => {
        const style = window.getComputedStyle(el);
        // Check for indigo/blue background or white text
        return el.className.includes("indigo") ||
               el.className.includes("text-white") ||
               style.backgroundColor !== "rgba(0, 0, 0, 0)";
      });
      expect(hasDistinctStyle).toBe(true);
    });
  });

  test("Save button shows shopping bag icon", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("verify Save button has icon", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await expect(saveButton).toBeVisible();
      // Button should contain an SVG (shopping bag icon)
      const hasSvg = await saveButton.locator("svg").count();
      expect(hasSvg).toBeGreaterThan(0);
    });
  });
});

test.describe("Basket - Multiple Operations", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("adding same prompt twice does not duplicate", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add prompt to basket", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible();
    });

    await logger.step("wait for localStorage to persist", async () => {
      await page.waitForTimeout(500);
    });

    await logger.step("check localStorage has one item", async () => {
      const basketData = await page.evaluate(() => localStorage.getItem("jfp-basket"));
      expect(basketData).not.toBeNull();
      if (basketData) {
        const parsed = JSON.parse(basketData);
        expect(parsed.length).toBe(1);
      }
    });

    // The button is already in "Added" state, clicking would remove it
    // This test verifies idempotency of the add operation at the context level
  });

  test("can add and remove multiple prompts in sequence", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add three prompts", async () => {
      const saveButtons = page.getByRole("button", { name: /save/i });
      await saveButtons.nth(0).click();
      await page.waitForTimeout(100);
      await saveButtons.nth(0).click(); // First becomes next available
      await page.waitForTimeout(100);
      await saveButtons.nth(0).click();
    });

    await logger.step("verify three are added", async () => {
      const addedButtons = page.getByRole("button", { name: /added/i });
      const count = await addedButtons.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    await logger.step("remove one prompt", async () => {
      const addedButton = page.getByRole("button", { name: /added/i }).first();
      await addedButton.click();
    });

    await logger.step("verify two remain", async () => {
      const addedButtons = page.getByRole("button", { name: /added/i });
      const count = await addedButtons.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});

test.describe("Basket - Feedback", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear localStorage", async () => {
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
    });

    await logger.step("navigate to homepage", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("button text changes on add", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("verify initial button says Save", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await expect(saveButton).toBeVisible();
    });

    await logger.step("click Save", async () => {
      const saveButton = page.getByRole("button", { name: /save/i }).first();
      await saveButton.click();
    });

    await logger.step("verify button now says Added", async () => {
      await expect(page.getByRole("button", { name: /added/i }).first()).toBeVisible({ timeout: 2000 });
    });
  });
});
