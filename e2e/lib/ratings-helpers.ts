import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper functions for Ratings & Reviews E2E tests
 */

// Navigation helpers

export async function gotoSwapMeetPrompt(page: Page, promptId: string): Promise<void> {
  await page.goto(`/swap-meet/${promptId}`, { waitUntil: "networkidle", timeout: 60000 });
}

export async function gotoSwapMeetPromptWithRatings(page: Page): Promise<void> {
  // Navigate to a known prompt that has ratings (using mock data comm-1)
  await gotoSwapMeetPrompt(page, "comm-1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

// Rating display selectors

export function getRatingStars(page: Page): Locator {
  // The star icon next to the rating number
  return page.locator('[data-testid="rating-stars"]').or(
    page.locator("text=/\\d\\.\\d/").filter({ has: page.locator('svg[class*="text-amber"]') })
  );
}

export function getRatingDisplay(page: Page): Locator {
  // Rating number display (e.g., "4.8")
  return page.locator("text=/^\\d\\.\\d$/").first();
}

export function getRatingCount(page: Page): Locator {
  // Rating count display (e.g., "(156 ratings)")
  return page.locator("text=/\\(\\d+.*ratings?\\)/i").first();
}

export function getStatsBar(page: Page): Locator {
  // The stats bar containing views, copies, saves
  return page.locator(".rounded-xl.bg-neutral-100, .rounded-xl.dark\\:bg-neutral-800\\/50");
}

// Rating interaction selectors

export function getThumbsUpButton(page: Page): Locator {
  return page.getByRole("button", { name: /yes.*helpful/i });
}

export function getThumbsDownButton(page: Page): Locator {
  return page.getByRole("button", { name: /not helpful/i });
}

export function getRatingSection(page: Page): Locator {
  // The "Was this prompt helpful?" section
  return page.locator("text=Was this prompt helpful?").locator("..");
}

export function getReportButton(page: Page): Locator {
  return page.getByRole("button", { name: /report/i });
}

// Action helpers

export async function ratePromptHelpful(page: Page): Promise<void> {
  const thumbsUp = getThumbsUpButton(page);
  await thumbsUp.click();
}

export async function ratePromptNotHelpful(page: Page): Promise<void> {
  const thumbsDown = getThumbsDownButton(page);
  await thumbsDown.click();
}

export async function toggleRating(page: Page, rating: "up" | "down"): Promise<void> {
  if (rating === "up") {
    await ratePromptHelpful(page);
  } else {
    await ratePromptNotHelpful(page);
  }
}

// Review selectors (for when review feature is implemented)

export function getReviewsList(page: Page): Locator {
  return page.locator("[data-testid='reviews-list']");
}

export function getReviewCards(page: Page): Locator {
  return page.locator("[data-testid='review-card']");
}

export function getWriteReviewButton(page: Page): Locator {
  return page.getByRole("button", { name: /write.*review/i });
}

export function getReviewTextarea(page: Page): Locator {
  return page.locator("textarea[placeholder*='review']");
}

export function getSubmitReviewButton(page: Page): Locator {
  return page.getByRole("button", { name: /submit.*review/i });
}

export function getReviewSortSelect(page: Page): Locator {
  return page.locator("[data-testid='review-sort']").or(
    page.getByRole("combobox", { name: /sort/i })
  );
}

export function getHelpfulButton(page: Page, reviewIndex: number): Locator {
  return getReviewCards(page).nth(reviewIndex).getByRole("button", { name: /helpful/i });
}

// Assertion helpers

export async function assertRatingVisible(page: Page): Promise<void> {
  // Check that rating display is visible
  await expect(page.locator("text=/\\d\\.\\d/").first()).toBeVisible();
}

export async function assertRatingCount(page: Page): Promise<void> {
  // Check that rating count is visible
  await expect(page.locator("text=/ratings?/i").first()).toBeVisible();
}

export async function assertThumbsUpSelected(page: Page): Promise<void> {
  const thumbsUp = getThumbsUpButton(page);
  // When selected, the button has default variant (filled) style
  await expect(thumbsUp).toHaveClass(/bg-emerald/);
}

export async function assertThumbsDownSelected(page: Page): Promise<void> {
  const thumbsDown = getThumbsDownButton(page);
  // When selected, the button has filled red style
  await expect(thumbsDown).toHaveClass(/bg-red/);
}

export async function assertNoRatingSelected(page: Page): Promise<void> {
  const thumbsUp = getThumbsUpButton(page);
  const thumbsDown = getThumbsDownButton(page);
  // Neither should have the filled style
  await expect(thumbsUp).not.toHaveClass(/bg-emerald/);
  await expect(thumbsDown).not.toHaveClass(/bg-red/);
}

// Utility functions

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatRatingCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
