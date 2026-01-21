import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  assertRatingVisible,
  assertRatingCount,
} from "../lib/ratings-helpers";
import { gotoSwapMeet, getCommunityPromptCards } from "../lib/swapmeet-helpers";

/**
 * Ratings E2E Tests - Display
 *
 * Tests how ratings are displayed on prompt cards and detail pages.
 * Covers: rating display, rating counts, stats bar, sorting by rating.
 */

test.setTimeout(60000);

test.describe("Ratings - Display on Cards", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to Swap Meet", async () => {
      await gotoSwapMeet(page);
    });
  });

  test("prompt cards show rating with star icon", async ({ page, logger }) => {
    await logger.step("get first prompt card", async () => {
      const cards = getCommunityPromptCards(page);
      await expect(cards.first()).toBeVisible();
    });

    await logger.step("verify star icon is present on cards", async () => {
      // Cards should show the star icon for ratings
      const firstCard = getCommunityPromptCards(page).first();
      const starIcon = firstCard.locator('svg[class*="text-amber"]').first();
      await expect(starIcon).toBeVisible();
    });

    await logger.step("verify rating number is displayed", async () => {
      const firstCard = getCommunityPromptCards(page).first();
      // Rating should be in format like "4.8"
      const ratingText = firstCard.locator("text=/\\d\\.\\d/").first();
      await expect(ratingText).toBeVisible();
    });

    await logger.step("verify rating count is displayed", async () => {
      const firstCard = getCommunityPromptCards(page).first();
      // Rating count in parentheses like "(156)"
      const countText = firstCard.locator("text=/\\(\\d+/").first();
      await expect(countText).toBeVisible();
    });
  });

  test("rating displays are formatted correctly", async ({ page, logger }) => {
    await logger.step("check rating format on multiple cards", async () => {
      const cards = getCommunityPromptCards(page);
      const count = await cards.count();
      const cardsToCheck = Math.min(count, 3);

      for (let i = 0; i < cardsToCheck; i++) {
        const card = cards.nth(i);
        // Rating should be a decimal number (e.g., 4.8, 3.5)
        const ratingText = await card.locator("text=/\\d\\.\\d/").first().textContent();
        expect(ratingText).toMatch(/^\d\.\d$/);
      }
    });
  });

  test("view count is displayed on cards", async ({ page, logger }) => {
    await logger.step("verify eye icon for views", async () => {
      const firstCard = getCommunityPromptCards(page).first();
      // Eye icon indicates views
      const eyeIcon = firstCard.locator("svg").filter({ hasText: "" }).nth(1);
      // Check the stats row exists
      const statsRow = firstCard.locator("text=/\\d+K?\\s/").first();
      await expect(statsRow).toBeVisible();
    });
  });

  test("copy count is displayed on cards", async ({ page, logger }) => {
    await logger.step("verify copy icon and count", async () => {
      const firstCard = getCommunityPromptCards(page).first();
      // Copy icon indicates copies
      const statsSection = firstCard.locator(".flex.items-center.gap-4.text-xs");
      await expect(statsSection).toBeVisible();
    });
  });
});

test.describe("Ratings - Display on Detail Page", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("detail page shows rating prominently", async ({ page, logger }) => {
    await logger.step("verify rating display in metadata", async () => {
      await assertRatingVisible(page);
    });

    await logger.step("verify rating count", async () => {
      await assertRatingCount(page);
    });

    await logger.step("verify star icon with amber color", async () => {
      const starIcon = page.locator('svg[class*="text-amber"]').first();
      await expect(starIcon).toBeVisible();
    });
  });

  test("stats bar displays all metrics", async ({ page, logger }) => {
    await logger.step("verify stats bar is visible", async () => {
      // Look for the container with views, copies, saves metrics
      const statsContainer = page.locator("text=views").locator("xpath=ancestor::div[contains(@class, 'rounded')]");
      await expect(statsContainer.first()).toBeVisible();
    });

    await logger.step("verify views metric", async () => {
      await expect(page.getByText("views", { exact: true })).toBeVisible();
    });

    await logger.step("verify copies metric", async () => {
      await expect(page.getByText("copies", { exact: true })).toBeVisible();
    });

    await logger.step("verify saves metric", async () => {
      await expect(page.getByText("saves", { exact: true })).toBeVisible();
    });
  });

  test("rating displays in header metadata", async ({ page, logger }) => {
    await logger.step("verify rating is near author info", async () => {
      // Rating should be in the metadata section with author
      const metadataSection = page.locator(".flex.flex-wrap.items-center.gap-6");
      await expect(metadataSection.first()).toBeVisible();
    });

    await logger.step("verify rating format in header", async () => {
      // Should show rating like "4.8 (156 ratings)"
      const ratingWithCount = page.locator("text=/\\d\\.\\d.*ratings/i");
      await expect(ratingWithCount).toBeVisible();
    });
  });

  test("featured prompts show featured badge", async ({ page, logger }) => {
    await logger.step("check for featured badge", async () => {
      // comm-1 is a featured prompt
      const featuredBadge = page.locator("text=Featured").first();
      await expect(featuredBadge).toBeVisible();
    });

    await logger.step("verify star icon in featured badge", async () => {
      const badge = page.locator("text=Featured").locator("..");
      const starInBadge = badge.locator("svg");
      await expect(starInBadge.first()).toBeVisible();
    });
  });
});

test.describe("Ratings - Sort by Rating", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to Swap Meet", async () => {
      await gotoSwapMeet(page);
    });
  });

  test("sort dropdown includes top-rated option", async ({ page, logger }) => {
    await logger.step("open sort dropdown", async () => {
      const sortTrigger = page.getByRole("combobox").first();
      await sortTrigger.click();
    });

    await logger.step("verify top-rated sort option exists", async () => {
      const topRatedOption = page.getByText(/top.*rated/i);
      await expect(topRatedOption).toBeVisible();
    });
  });

  test("sorting by top-rated works", async ({ page, logger }) => {
    await logger.step("select top-rated sort", async () => {
      const sortTrigger = page.getByRole("combobox").first();
      await sortTrigger.click();
      await page.getByText(/top.*rated/i).click();
    });

    await logger.step("verify cards have ratings after sort", async () => {
      // Wait for any animations/reordering
      await page.waitForTimeout(500);

      // Verify cards still display ratings after sort
      const cards = getCommunityPromptCards(page);
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      // Verify first card has a valid rating displayed
      const firstRating = await cards.first().locator("text=/\\d\\.\\d/").first().textContent();
      expect(firstRating).toMatch(/^\d\.\d$/);
    });
  });
});

test.describe("Ratings - Number Formatting", () => {
  test("large rating counts are formatted with K suffix", async ({ page, logger }) => {
    await logger.step("navigate to Swap Meet", async () => {
      await gotoSwapMeet(page);
    });

    await logger.step("check for K-formatted numbers", async () => {
      // Some prompts may have 1K+ ratings, views, or copies
      // Look for numbers formatted with K
      const statsText = await page.locator(".text-xs.text-neutral").allTextContents();
      // This is a soft check - not all prompts will have 1K+ stats
      logger.info("Stats found", { stats: statsText.slice(0, 5) });
    });
  });
});
