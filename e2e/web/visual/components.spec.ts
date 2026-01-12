import { test, expect } from "@playwright/test";

/**
 * Component Visual Regression Tests
 *
 * Captures baseline screenshots of major UI components
 * and detects visual regressions after changes.
 *
 * Run with: bun test:e2e e2e/web/visual/
 * Update baselines: bun test:e2e e2e/web/visual/ --update-snapshots
 */

test.describe("Component Visual Regression", () => {
  test.describe("PromptCard", () => {
    test("light mode - default state", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      const card = page.locator('[data-testid="prompt-card"]').first();
      await expect(card).toBeVisible();

      await expect(card).toHaveScreenshot("prompt-card-light-default.png", {
        maxDiffPixels: 100,
      });

      console.log("[VISUAL] PromptCard light mode default - captured");
    });

    test("light mode - hover state", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      const card = page.locator('[data-testid="prompt-card"]').first();
      await card.hover();

      // Wait for hover transition
      await page.waitForTimeout(300);

      await expect(card).toHaveScreenshot("prompt-card-light-hover.png", {
        maxDiffPixels: 100,
      });

      console.log("[VISUAL] PromptCard light mode hover - captured");
    });

    test("dark mode - default state", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      const card = page.locator('[data-testid="prompt-card"]').first();
      await expect(card).toHaveScreenshot("prompt-card-dark-default.png", {
        maxDiffPixels: 100,
      });

      console.log("[VISUAL] PromptCard dark mode default - captured");
    });

    test("featured card variant", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Look for featured card (has featured badge or indicator)
      const featuredCard = page.locator('[data-testid="prompt-card"]').filter({
        has: page.locator('text="Featured"'),
      }).first();

      if ((await featuredCard.count()) > 0) {
        await expect(featuredCard).toHaveScreenshot("prompt-card-featured.png", {
          maxDiffPixels: 100,
        });
        console.log("[VISUAL] PromptCard featured - captured");
      } else {
        console.log("[VISUAL] PromptCard featured - skipped (no featured cards visible)");
      }
    });
  });

  test.describe("Hero Section", () => {
    test("full hero - light mode", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Hero is the first major section on the page
      const hero = page.locator("section").first();
      await expect(hero).toBeVisible();

      await expect(hero).toHaveScreenshot("hero-light.png", {
        maxDiffPixels: 200,
      });

      console.log("[VISUAL] Hero light mode - captured");
    });

    test("full hero - dark mode", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      const hero = page.locator("section").first();
      await expect(hero).toHaveScreenshot("hero-dark.png", {
        maxDiffPixels: 200,
      });

      console.log("[VISUAL] Hero dark mode - captured");
    });

    test("category pills - selected state", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Find and click a category pill (e.g., "ideation")
      const categoryPill = page.getByRole("button", { name: /^ideation$/i });
      if ((await categoryPill.count()) > 0) {
        await categoryPill.click();
        await page.waitForTimeout(300); // Wait for selection animation

        // Capture the category filter area
        const filterArea = page.locator('[aria-label="Filter by category"]').first();
        if ((await filterArea.count()) > 0) {
          await expect(filterArea).toHaveScreenshot("category-pills-selected.png", {
            maxDiffPixels: 100,
          });
          console.log("[VISUAL] Category pills selected - captured");
        } else {
          console.log("[VISUAL] Category pills selected - skipped (filter area not found)");
        }
      } else {
        console.log("[VISUAL] Category pills selected - skipped (no category pills)");
      }
    });
  });

  test.describe("SpotlightSearch", () => {
    test("empty state - light mode", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Open Spotlight with keyboard shortcut
      await page.keyboard.press("Meta+k");
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      await expect(dialog).toHaveScreenshot("spotlight-empty-light.png", {
        maxDiffPixels: 150,
      });

      console.log("[VISUAL] SpotlightSearch empty light - captured");
    });

    test("with results - light mode", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Open Spotlight
      await page.keyboard.press("Meta+k");
      await page.waitForSelector('[role="dialog"]');

      // Type search query
      await page.fill('input[type="text"]', "testing");
      await page.waitForTimeout(500); // Wait for debounce and results

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toHaveScreenshot("spotlight-results-light.png", {
        maxDiffPixels: 200,
      });

      console.log("[VISUAL] SpotlightSearch with results - captured");
    });

    test("category filter selected", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Open Spotlight
      await page.keyboard.press("Meta+k");
      await page.waitForSelector('[role="dialog"]');

      // Click a category pill in Spotlight
      const debuggingPill = page.locator('[role="dialog"] button:has-text("debugging")');
      if ((await debuggingPill.count()) > 0) {
        await debuggingPill.click();
        await page.waitForTimeout(300);

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toHaveScreenshot("spotlight-category-selected.png", {
          maxDiffPixels: 150,
        });
        console.log("[VISUAL] SpotlightSearch category selected - captured");
      } else {
        console.log("[VISUAL] SpotlightSearch category selected - skipped");
      }
    });

    test("dark mode", async ({ page }) => {
      await page.goto("/");

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Open Spotlight
      await page.keyboard.press("Meta+k");
      await page.waitForSelector('[role="dialog"]');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toHaveScreenshot("spotlight-dark.png", {
        maxDiffPixels: 150,
      });

      console.log("[VISUAL] SpotlightSearch dark mode - captured");
    });
  });

  test.describe("BasketSidebar", () => {
    test("empty basket", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Find and click basket trigger
      const basketTrigger = page.locator('[aria-label*="basket" i], [aria-label*="Basket" i]').first();
      if ((await basketTrigger.count()) > 0) {
        await basketTrigger.click();
        await page.waitForTimeout(500); // Wait for sidebar animation

        const sidebar = page.locator("aside");
        if ((await sidebar.count()) > 0) {
          await expect(sidebar).toHaveScreenshot("basket-empty.png", {
            maxDiffPixels: 100,
          });
          console.log("[VISUAL] BasketSidebar empty - captured");
        } else {
          console.log("[VISUAL] BasketSidebar empty - skipped (sidebar not found)");
        }
      } else {
        console.log("[VISUAL] BasketSidebar empty - skipped (trigger not found)");
      }
    });

    test("with items", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Add item to basket via card button
      const addButton = page.locator('[data-testid="prompt-card"] button[aria-label*="basket" i], [data-testid="prompt-card"] button[aria-label*="Add" i]').first();
      if ((await addButton.count()) > 0) {
        await addButton.click();
        await page.waitForTimeout(300);

        // Open basket
        const basketTrigger = page.locator('nav [aria-label*="basket" i], nav [aria-label*="Basket" i]').first();
        if ((await basketTrigger.count()) > 0) {
          await basketTrigger.click();
          await page.waitForTimeout(500);

          const sidebar = page.locator("aside");
          if ((await sidebar.count()) > 0) {
            await expect(sidebar).toHaveScreenshot("basket-with-items.png", {
              maxDiffPixels: 100,
            });
            console.log("[VISUAL] BasketSidebar with items - captured");
          }
        }
      } else {
        console.log("[VISUAL] BasketSidebar with items - skipped (add button not found)");
      }
    });
  });

  test.describe("PromptDetailModal", () => {
    test("modal open - light mode", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      // Click view on first card
      const viewButton = page.locator('[data-testid="prompt-card"] button:has-text("View")').first();
      if ((await viewButton.count()) > 0) {
        await viewButton.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toHaveScreenshot("prompt-modal-light.png", {
          maxDiffPixels: 300,
        });

        console.log("[VISUAL] PromptDetailModal light - captured");
      } else {
        console.log("[VISUAL] PromptDetailModal light - skipped (view button not found)");
      }
    });

    test("modal open - dark mode", async ({ page }) => {
      await page.goto("/");

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("The Idea Wizard")).toBeVisible({ timeout: 10000 });

      const viewButton = page.locator('[data-testid="prompt-card"] button:has-text("View")').first();
      if ((await viewButton.count()) > 0) {
        await viewButton.click();
        await page.waitForSelector('[role="dialog"]');

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toHaveScreenshot("prompt-modal-dark.png", {
          maxDiffPixels: 300,
        });

        console.log("[VISUAL] PromptDetailModal dark - captured");
      } else {
        console.log("[VISUAL] PromptDetailModal dark - skipped");
      }
    });
  });
});
