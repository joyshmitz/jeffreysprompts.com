import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  getThumbsUpButton,
  getThumbsDownButton,
  getRatingSection,
  ratePromptHelpful,
  ratePromptNotHelpful,
} from "../lib/ratings-helpers";

/**
 * Ratings E2E Tests - Rating Prompts
 *
 * Tests the thumbs up/down rating functionality on the prompt detail page.
 * Covers: rating, updating rating, removing rating.
 */

test.setTimeout(60000);

test.describe("Ratings - Rate Prompt", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("rating section displays on prompt detail page", async ({ page, logger }) => {
    await logger.step("verify rating section header", async () => {
      await expect(page.getByText("Was this prompt helpful?")).toBeVisible();
    });

    await logger.step("verify thumbs up button", async () => {
      const thumbsUp = getThumbsUpButton(page);
      await expect(thumbsUp).toBeVisible();
      await expect(thumbsUp).toHaveText(/yes.*helpful/i);
    });

    await logger.step("verify thumbs down button", async () => {
      const thumbsDown = getThumbsDownButton(page);
      await expect(thumbsDown).toBeVisible();
      await expect(thumbsDown).toHaveText(/not helpful/i);
    });
  });

  test("can rate prompt as helpful (thumbs up)", async ({ page, logger }) => {
    await logger.step("click thumbs up button", async () => {
      await ratePromptHelpful(page);
    });

    await logger.step("verify thumbs up is selected", async () => {
      const thumbsUp = getThumbsUpButton(page);
      // The button should have the filled emerald style when selected
      await expect(thumbsUp).toHaveClass(/bg-emerald/);
    });

    await logger.step("verify success toast appears", async () => {
      // Toast should show feedback confirmation
      await expect(page.getByText(/thanks.*feedback/i)).toBeVisible();
    });
  });

  test("can rate prompt as not helpful (thumbs down)", async ({ page, logger }) => {
    await logger.step("click thumbs down button", async () => {
      await ratePromptNotHelpful(page);
    });

    await logger.step("verify thumbs down is selected", async () => {
      const thumbsDown = getThumbsDownButton(page);
      // The button should have the filled red style when selected
      await expect(thumbsDown).toHaveClass(/bg-red/);
    });

    await logger.step("verify success toast appears", async () => {
      await expect(page.getByText(/thanks.*feedback/i)).toBeVisible();
    });
  });

  test("can toggle rating from up to down", async ({ page, logger }) => {
    await logger.step("initially rate as helpful", async () => {
      await ratePromptHelpful(page);
      const thumbsUp = getThumbsUpButton(page);
      await expect(thumbsUp).toHaveClass(/bg-emerald/);
    });

    await logger.step("wait for toast to clear", async () => {
      await page.waitForTimeout(3500); // Toast duration + buffer
    });

    await logger.step("change rating to not helpful", async () => {
      await ratePromptNotHelpful(page);
    });

    await logger.step("verify thumbs down is now selected", async () => {
      const thumbsDown = getThumbsDownButton(page);
      await expect(thumbsDown).toHaveClass(/bg-red/);
    });

    await logger.step("verify thumbs up is no longer selected", async () => {
      const thumbsUp = getThumbsUpButton(page);
      await expect(thumbsUp).not.toHaveClass(/bg-emerald/);
    });
  });

  test("can remove rating by clicking same button again", async ({ page, logger }) => {
    await logger.step("rate as helpful", async () => {
      await ratePromptHelpful(page);
      const thumbsUp = getThumbsUpButton(page);
      await expect(thumbsUp).toHaveClass(/bg-emerald/);
    });

    await logger.step("wait for toast to clear", async () => {
      await page.waitForTimeout(3500);
    });

    await logger.step("click thumbs up again to remove rating", async () => {
      await ratePromptHelpful(page);
    });

    await logger.step("verify rating is removed (button not selected)", async () => {
      const thumbsUp = getThumbsUpButton(page);
      // After toggling off, it should have outline variant (not filled)
      await expect(thumbsUp).not.toHaveClass(/bg-emerald/);
    });
  });

  test("rating buttons are accessible", async ({ page, logger }) => {
    await logger.step("verify thumbs up has accessible name", async () => {
      const thumbsUp = getThumbsUpButton(page);
      await expect(thumbsUp).toBeEnabled();
      // Check button is focusable
      await thumbsUp.focus();
      await expect(thumbsUp).toBeFocused();
    });

    await logger.step("verify thumbs down has accessible name", async () => {
      const thumbsDown = getThumbsDownButton(page);
      await expect(thumbsDown).toBeEnabled();
      await thumbsDown.focus();
      await expect(thumbsDown).toBeFocused();
    });

    await logger.step("verify keyboard interaction works", async () => {
      const thumbsUp = getThumbsUpButton(page);
      await thumbsUp.focus();
      await page.keyboard.press("Enter");
      // Should trigger the rating
      await expect(thumbsUp).toHaveClass(/bg-emerald/);
    });
  });

  test("rating section is visually distinct", async ({ page, logger }) => {
    await logger.step("verify rating section is in a card", async () => {
      const ratingSection = getRatingSection(page);
      // The section should be within a Card component
      await expect(ratingSection.locator("xpath=ancestor::*[contains(@class, 'rounded')]")).toBeVisible();
    });

    await logger.step("verify report button is present", async () => {
      await expect(page.getByRole("button", { name: /report/i })).toBeVisible();
    });
  });
});

test.describe("Ratings - Report Prompt", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt detail page", async () => {
      await gotoSwapMeetPrompt(page, "comm-1");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test("report button is visible", async ({ page, logger }) => {
    await logger.step("verify report button exists", async () => {
      const reportButton = page.getByRole("button", { name: /report/i });
      await expect(reportButton).toBeVisible();
    });
  });

  test("report button has correct styling", async ({ page, logger }) => {
    await logger.step("verify report button is ghost variant", async () => {
      const reportButton = page.getByRole("button", { name: /report/i });
      // Ghost buttons have subtle styling
      await expect(reportButton).toHaveClass(/text-neutral/);
    });
  });
});
