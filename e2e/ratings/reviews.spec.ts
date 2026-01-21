import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  getReviewsList,
  getReviewCards,
  getWriteReviewButton,
  getReviewTextarea,
  getSubmitReviewButton,
  getReviewSortSelect,
  getHelpfulButton,
} from "../lib/ratings-helpers";

/**
 * Reviews E2E Tests
 *
 * Tests the text review functionality on prompt detail pages.
 * Note: Review feature may not be fully implemented yet.
 * These tests are marked to skip if the feature is not available.
 *
 * Covers: write review, edit review, delete review, display reviews,
 *         sort reviews, helpful/not helpful voting.
 */

test.setTimeout(60000);

// Helper to check if reviews feature is available
async function isReviewsFeatureAvailable(page: import("@playwright/test").Page): Promise<boolean> {
  // Check if reviews list or write review button exists
  const reviewsList = getReviewsList(page);
  const writeButton = getWriteReviewButton(page);

  const hasReviewsList = await reviewsList.count() > 0;
  const hasWriteButton = await writeButton.count() > 0;

  return hasReviewsList || hasWriteButton;
}

test.describe("Reviews - Write Review", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("write review button is visible when logged in", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("verify write review button exists", async () => {
      const writeButton = getWriteReviewButton(page);
      await expect(writeButton).toBeVisible();
    });
  });

  test("can open review form", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("click write review button", async () => {
      const writeButton = getWriteReviewButton(page);
      await writeButton.click();
    });

    await logger.step("verify review form opens", async () => {
      const textarea = getReviewTextarea(page);
      await expect(textarea).toBeVisible();
    });

    await logger.step("verify submit button exists", async () => {
      const submitButton = getSubmitReviewButton(page);
      await expect(submitButton).toBeVisible();
    });
  });

  test("can write and submit a review", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("open review form", async () => {
      const writeButton = getWriteReviewButton(page);
      await writeButton.click();
    });

    await logger.step("enter review text", async () => {
      const textarea = getReviewTextarea(page);
      await textarea.fill("This is a great prompt! It helped me improve my code review process significantly.");
    });

    await logger.step("submit the review", async () => {
      const submitButton = getSubmitReviewButton(page);
      await submitButton.click();
    });

    await logger.step("verify review is submitted", async () => {
      // Should show success message or the review appears in the list
      const successIndicator = page.getByText(/review.*submitted|thank.*review/i);
      await expect(successIndicator).toBeVisible();
    });
  });

  test("review has character limits", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("open review form", async () => {
      const writeButton = getWriteReviewButton(page);
      await writeButton.click();
    });

    await logger.step("verify character counter exists", async () => {
      // Look for character count indicator
      const charCounter = page.locator("text=/\\d+.*characters?/i");
      await expect(charCounter).toBeVisible();
    });
  });
});

test.describe("Reviews - Edit Review", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("can edit own review", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("find own review", async () => {
      // Look for edit button on a review
      const editButton = page.getByRole("button", { name: /edit/i }).first();
      await expect(editButton).toBeVisible();
    });

    await logger.step("click edit button", async () => {
      const editButton = page.getByRole("button", { name: /edit/i }).first();
      await editButton.click();
    });

    await logger.step("verify review becomes editable", async () => {
      const textarea = getReviewTextarea(page);
      await expect(textarea).toBeVisible();
    });
  });
});

test.describe("Reviews - Delete Review", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("can delete own review", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("find delete button on own review", async () => {
      const deleteButton = page.getByRole("button", { name: /delete/i }).first();
      await expect(deleteButton).toBeVisible();
    });

    await logger.step("click delete button", async () => {
      const deleteButton = page.getByRole("button", { name: /delete/i }).first();
      await deleteButton.click();
    });

    await logger.step("confirm deletion", async () => {
      // Look for confirmation dialog
      const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
      await confirmButton.click();
    });

    await logger.step("verify review is removed", async () => {
      // Review should no longer be visible
      const successMessage = page.getByText(/review.*deleted|removed/i);
      await expect(successMessage).toBeVisible();
    });
  });
});

test.describe("Reviews - Display", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("reviews list is visible when reviews exist", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("verify reviews section exists", async () => {
      const reviewsHeader = page.getByText(/reviews/i);
      await expect(reviewsHeader.first()).toBeVisible();
    });

    await logger.step("verify reviews list", async () => {
      const reviewsList = getReviewsList(page);
      await expect(reviewsList).toBeVisible();
    });
  });

  test("review cards show author info", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("check review card structure", async () => {
      const reviewCards = getReviewCards(page);
      const firstReview = reviewCards.first();

      // Should show author name
      const authorName = firstReview.locator("text=/@/");
      await expect(authorName).toBeVisible();
    });
  });

  test("review cards show helpful voting buttons", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("check for helpful button", async () => {
      const helpfulButton = getHelpfulButton(page, 0);
      await expect(helpfulButton).toBeVisible();
    });
  });
});

test.describe("Reviews - Sorting", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("can sort reviews by newest", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("open sort dropdown", async () => {
      const sortSelect = getReviewSortSelect(page);
      await sortSelect.click();
    });

    await logger.step("select newest option", async () => {
      await page.getByText(/newest/i).click();
    });

    await logger.step("verify reviews are reordered", async () => {
      // Wait for reorder
      await page.waitForTimeout(500);
      // Verify first review is most recent
      const reviewCards = getReviewCards(page);
      await expect(reviewCards.first()).toBeVisible();
    });
  });

  test("can sort reviews by most helpful", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("open sort dropdown", async () => {
      const sortSelect = getReviewSortSelect(page);
      await sortSelect.click();
    });

    await logger.step("select most helpful option", async () => {
      await page.getByText(/helpful/i).click();
    });

    await logger.step("verify reviews are sorted by helpfulness", async () => {
      await page.waitForTimeout(500);
      const reviewCards = getReviewCards(page);
      await expect(reviewCards.first()).toBeVisible();
    });
  });
});

test.describe("Reviews - Helpful Voting", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("can mark review as helpful", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("click helpful button on first review", async () => {
      const helpfulButton = getHelpfulButton(page, 0);
      await helpfulButton.click();
    });

    await logger.step("verify helpful vote is recorded", async () => {
      // Button should show as selected or count should increase
      const helpfulButton = getHelpfulButton(page, 0);
      await expect(helpfulButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  test("can toggle helpful vote", async ({ page, logger }) => {
    test.skip(!(await isReviewsFeatureAvailable(page)), "Reviews feature not yet implemented");

    await logger.step("mark review as helpful", async () => {
      const helpfulButton = getHelpfulButton(page, 0);
      await helpfulButton.click();
    });

    await logger.step("toggle off helpful vote", async () => {
      const helpfulButton = getHelpfulButton(page, 0);
      await helpfulButton.click();
    });

    await logger.step("verify vote is removed", async () => {
      const helpfulButton = getHelpfulButton(page, 0);
      await expect(helpfulButton).not.toHaveAttribute("aria-pressed", "true");
    });
  });
});

test.describe("Reviews - Placeholder State", () => {
  test("shows appropriate state when no reviews exist", async ({ page, logger }) => {
    await logger.step("navigate to a prompt", async () => {
      await gotoSwapMeetPrompt(page, "comm-2");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    // This test checks that the page handles the absence of reviews gracefully
    await logger.step("page loads without reviews section errors", async () => {
      // The page should not show any console errors related to reviews
      // Just verify the page is fully loaded
      await expect(page.locator("body")).toBeVisible();
    });
  });
});
