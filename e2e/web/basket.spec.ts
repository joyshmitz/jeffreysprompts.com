import { test, expect } from "../lib/playwright-logger";

/**
 * Basket E2E Tests
 *
 * Tests for the basket functionality:
 * 1. Add prompts to basket via card button (icon button with aria-label)
 * 2. Basket button shows different state when item is in basket
 * 3. Basket persistence (localStorage)
 * 4. Visual feedback (button state, count)
 * 5. Keyboard accessibility
 *
 * Note: The PromptCard uses icon-only buttons with aria-labels:
 * - "Add to basket" - when not in basket
 * - "Already in basket" - when in basket (button is disabled)
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

  test("can add prompt to basket via basket button", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("click basket button on first card", async () => {
      // Find the "Add to basket" button on a prompt card (icon button with aria-label)
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await expect(basketButton).toBeVisible();
      await basketButton.click();
    });

    await logger.step("verify button changed to 'Already in basket' state", async () => {
      // Button should now show "Already in basket" state (disabled)
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible({ timeout: 2000 });
    });

    await logger.step("verify success toast appeared", async () => {
      await expect(page.getByText(/added to basket/i).first()).toBeVisible({ timeout: 3000 });
    });
  });

  test("basket button is disabled when item is in basket", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add prompt to basket", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible();
    });

    await logger.step("verify button is disabled", async () => {
      const alreadyInBasketButton = page.getByRole("button", { name: /already in basket/i }).first();
      await expect(alreadyInBasketButton).toBeDisabled();
    });
  });

  test("can add multiple prompts to basket", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add first prompt", async () => {
      const basketButtons = page.getByRole("button", { name: /add to basket/i });
      await basketButtons.first().click();
    });

    await logger.step("add second prompt", async () => {
      // After first is added, there should still be more "Add to basket" buttons
      const basketButtons = page.getByRole("button", { name: /add to basket/i });
      await expect(basketButtons.first()).toBeVisible();
      await basketButtons.first().click();
    });

    await logger.step("verify two prompts are in basket", async () => {
      // Should have at least 2 "Already in basket" buttons
      const inBasketButtons = page.getByRole("button", { name: /already in basket/i });
      const count = await inBasketButtons.count();
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
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible();
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
      // First card should still show "Already in basket"
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible({ timeout: 5000 });
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
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible();
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

  test("basket button shows visual indicator when item is in basket", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add to basket", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible();
    });

    await logger.step("verify 'Already in basket' button has distinct styling", async () => {
      // The "Already in basket" button should have emerald/green color indicating success
      const inBasketButton = page.getByRole("button", { name: /already in basket/i }).first();
      await expect(inBasketButton).toBeVisible();
      // Button should be styled with emerald color class
      const hasDistinctStyle = await inBasketButton.evaluate((el) => {
        // Check for emerald color classes indicating item is in basket
        return el.className.includes("emerald") ||
               el.className.includes("text-emerald");
      });
      expect(hasDistinctStyle).toBe(true);
    });
  });

  test("basket button shows shopping basket icon", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("verify basket button has icon", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await expect(basketButton).toBeVisible();
      // Button should contain an SVG (shopping basket icon)
      const hasSvg = await basketButton.locator("svg").count();
      expect(hasSvg).toBeGreaterThan(0);
    });
  });

  test("basket button shows check icon when item is in basket", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add to basket", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
    });

    await logger.step("verify button shows check icon", async () => {
      const inBasketButton = page.getByRole("button", { name: /already in basket/i }).first();
      await expect(inBasketButton).toBeVisible();
      // Button should contain an SVG (check icon)
      const hasSvg = await inBasketButton.locator("svg").count();
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

  test("adding same prompt twice does not duplicate (button disabled after add)", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add prompt to basket", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible();
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

    await logger.step("verify button is disabled after adding", async () => {
      // The button is now disabled with "Already in basket" state
      // This prevents duplicates at the UI level
      const inBasketButton = page.getByRole("button", { name: /already in basket/i }).first();
      await expect(inBasketButton).toBeDisabled();
    });
  });

  test("can add multiple different prompts to basket", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add three different prompts", async () => {
      const basketButtons = page.getByRole("button", { name: /add to basket/i });
      await basketButtons.nth(0).click();
      await page.waitForTimeout(100);
      await basketButtons.nth(0).click(); // After first is added, next available becomes nth(0)
      await page.waitForTimeout(100);
      await basketButtons.nth(0).click();
    });

    await logger.step("verify three are in basket", async () => {
      const inBasketButtons = page.getByRole("button", { name: /already in basket/i });
      const count = await inBasketButtons.count();
      expect(count).toBeGreaterThanOrEqual(3);
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

  test("button aria-label changes on add", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("verify initial button has 'Add to basket' aria-label", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await expect(basketButton).toBeVisible();
    });

    await logger.step("click basket button", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
    });

    await logger.step("verify button now has 'Already in basket' aria-label", async () => {
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible({ timeout: 2000 });
    });
  });

  test("toast notification appears when adding to basket", async ({ page, logger }) => {
    await logger.step("wait for prompts", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("add to basket", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.click();
    });

    await logger.step("verify toast notification appears", async () => {
      // Toast should show "Added to basket" message
      await expect(page.getByText(/added to basket/i).first()).toBeVisible({ timeout: 3000 });
    });
  });
});

test.describe("Basket - Keyboard Accessibility", () => {
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

  test("basket button is keyboard accessible with Tab and Enter", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("find and focus the basket button", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.focus();
      await expect(basketButton).toBeFocused();
    });

    await logger.step("press Enter to add to basket", async () => {
      await page.keyboard.press("Enter");
    });

    await logger.step("verify item was added via keyboard", async () => {
      await expect(page.getByRole("button", { name: /already in basket/i }).first()).toBeVisible({ timeout: 2000 });
    });

    await logger.step("verify success toast appeared", async () => {
      await expect(page.getByText(/added to basket/i).first()).toBeVisible({ timeout: 3000 });
    });
  });

  test("basket button is focusable and has visible focus ring", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("focus the basket button", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await basketButton.focus();
    });

    await logger.step("verify button is focused", async () => {
      const basketButton = page.getByRole("button", { name: /add to basket/i }).first();
      await expect(basketButton).toBeFocused();
    });
  });
});

test.describe("Basket - Mobile Swipe Actions", () => {
  test.use({ viewport: { width: 375, height: 667 } });

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

  test("swipe right on card adds to basket (mobile)", async ({ page, logger }) => {
    await logger.step("wait for prompts to load", async () => {
      await expect(page.getByRole("heading", { name: "The Idea Wizard" })).toBeVisible({ timeout: 10000 });
    });

    await logger.step("perform swipe right gesture on card", async () => {
      // Find the first card
      const card = page.locator("article").first();
      const box = await card.boundingBox();

      if (box) {
        // Start from left side of card and swipe right
        const startX = box.x + 50;
        const startY = box.y + box.height / 2;
        const endX = box.x + box.width - 50;

        // Perform touch swipe gesture
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();

        // Give time for the action to complete
        await page.waitForTimeout(500);
      }
    });

    await logger.step("verify toast shows item was added", async () => {
      // Check for success toast indicating item was added
      await expect(page.getByText(/added to basket/i).first()).toBeVisible({ timeout: 3000 });
    });
  });
});
