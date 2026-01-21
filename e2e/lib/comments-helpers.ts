import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper functions for Comments & Discussions E2E tests
 *
 * Comments API (premium feature):
 * - GET /api/prompts/:id/comments - List comments
 * - POST /api/prompts/:id/comments - Create comment
 * - PUT /api/prompts/:id/comments/:commentId - Edit comment
 * - DELETE /api/prompts/:id/comments/:commentId - Delete comment
 * - POST /api/prompts/:id/comments/:commentId/upvote - Toggle upvote
 * - POST /api/prompts/:id/comments/:commentId/pin - Toggle pin (owner only)
 * - POST /api/prompts/:id/comments/:commentId/hide - Toggle hide (owner only)
 */

// Navigation helpers

export async function gotoPromptPage(page: Page, promptId: string): Promise<void> {
  await page.goto(`/prompts/${promptId}`, { waitUntil: "networkidle", timeout: 60000 });
}

export async function gotoSwapMeetPrompt(page: Page, promptId: string): Promise<void> {
  await page.goto(`/swap-meet/${promptId}`, { waitUntil: "networkidle", timeout: 60000 });
}

// Feature detection

export async function isCommentsFeatureAvailable(page: Page): Promise<boolean> {
  const commentsSection = getCommentsSection(page);
  const commentInput = getCommentInput(page);
  const commentsList = getCommentsList(page);

  const [hasSection, hasInput, hasList] = await Promise.all([
    commentsSection.isVisible().catch(() => false),
    commentInput.isVisible().catch(() => false),
    commentsList.isVisible().catch(() => false),
  ]);

  return hasSection || hasInput || hasList;
}

// Comment section selectors

export function getCommentsSection(page: Page): Locator {
  return page.locator("[data-testid='comments-section']").or(
    page.locator("section").filter({ hasText: /comments|discussions/i })
  );
}

export function getCommentsList(page: Page): Locator {
  return page.locator("[data-testid='comments-list']");
}

export function getCommentCards(page: Page): Locator {
  return page.locator("[data-testid='comment-card']");
}

export function getCommentCount(page: Page): Locator {
  return page.locator("text=/\\d+.*comments?/i").first();
}

// Comment input selectors

export function getCommentInput(page: Page): Locator {
  return page.locator("[data-testid='comment-input']").or(
    page.getByPlaceholder(/add.*comment|write.*comment|your comment/i)
  );
}

export function getSubmitCommentButton(page: Page): Locator {
  return page.getByRole("button", { name: /post|submit|comment/i }).filter({
    has: page.locator(":not([disabled])"),
  });
}

// Individual comment selectors

export function getCommentByText(page: Page, text: string): Locator {
  return getCommentCards(page).filter({ hasText: text });
}

export function getCommentAuthor(comment: Locator): Locator {
  return comment.locator("[data-testid='comment-author']").or(
    comment.locator(".font-semibold, .font-medium").first()
  );
}

export function getCommentContent(comment: Locator): Locator {
  return comment.locator("[data-testid='comment-content']").or(
    comment.locator("p").first()
  );
}

export function getCommentTimestamp(comment: Locator): Locator {
  return comment.locator("[data-testid='comment-timestamp']").or(
    comment.locator("text=/ago|just now|yesterday/i")
  );
}

// Comment action selectors

export function getCommentUpvoteButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /upvote|like|helpful/i }).or(
    comment.locator("button").filter({ has: comment.page().locator("svg.lucide-thumbs-up") })
  );
}

export function getCommentReplyButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /reply/i });
}

export function getCommentEditButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /edit/i });
}

export function getCommentDeleteButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /delete/i });
}

export function getCommentMenuButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /more|menu|options/i }).or(
    comment.locator("button").filter({ has: comment.page().locator("svg.lucide-more-horizontal, svg.lucide-more-vertical") })
  );
}

// Moderation selectors (for prompt owners)

export function getCommentPinButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /pin/i }).or(
    comment.getByRole("menuitem", { name: /pin/i })
  );
}

export function getCommentHideButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /hide/i }).or(
    comment.getByRole("menuitem", { name: /hide/i })
  );
}

export function getPinnedBadge(comment: Locator): Locator {
  return comment.locator("[data-testid='pinned-badge']").or(
    comment.locator("text=/pinned/i")
  );
}

// Reply/threading selectors

export function getReplyInput(comment: Locator): Locator {
  return comment.locator("[data-testid='reply-input']").or(
    comment.getByPlaceholder(/reply|respond/i)
  );
}

export function getSubmitReplyButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /reply|post/i });
}

export function getRepliesList(comment: Locator): Locator {
  return comment.locator("[data-testid='replies-list']");
}

export function getReplies(comment: Locator): Locator {
  return getRepliesList(comment).locator("[data-testid='comment-card']");
}

export function getShowRepliesButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /show.*repl|view.*repl|\\d+.*repl/i });
}

export function getHideRepliesButton(comment: Locator): Locator {
  return comment.getByRole("button", { name: /hide.*repl|collapse/i });
}

// Sort/filter selectors

export function getCommentSortSelect(page: Page): Locator {
  return page.locator("[data-testid='comment-sort']").or(
    page.getByRole("combobox", { name: /sort/i })
  );
}

export function getSortOption(page: Page, option: "newest" | "oldest" | "popular"): Locator {
  const labels: Record<string, RegExp> = {
    newest: /newest|latest|recent/i,
    oldest: /oldest|first/i,
    popular: /popular|top|best/i,
  };
  return page.getByRole("option", { name: labels[option] });
}

// Action helpers

export async function postComment(page: Page, text: string): Promise<void> {
  const input = getCommentInput(page);
  await input.fill(text);
  const submitButton = getSubmitCommentButton(page);
  await submitButton.click();
  await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
}

export async function replyToComment(comment: Locator, text: string): Promise<void> {
  const replyButton = getCommentReplyButton(comment);
  await replyButton.click();
  const replyInput = getReplyInput(comment);
  await replyInput.fill(text);
  const submitButton = getSubmitReplyButton(comment);
  await submitButton.click();
  await expect(comment.page().getByText(text)).toBeVisible({ timeout: 10000 });
}

export async function upvoteComment(comment: Locator): Promise<void> {
  const upvoteButton = getCommentUpvoteButton(comment);
  await upvoteButton.click();
}

export async function editComment(comment: Locator, newText: string): Promise<void> {
  const editButton = getCommentEditButton(comment);
  await editButton.click();
  const input = comment.locator("textarea, input[type='text']");
  await input.clear();
  await input.fill(newText);
  const saveButton = comment.getByRole("button", { name: /save|update/i });
  await saveButton.click();
  await expect(comment.page().getByText(newText)).toBeVisible({ timeout: 10000 });
}

export async function deleteComment(comment: Locator): Promise<void> {
  const deleteButton = getCommentDeleteButton(comment);
  await deleteButton.click();
  // Handle confirmation dialog if present
  const confirmButton = comment.page().getByRole("button", { name: /confirm|yes|delete/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
}

export async function pinComment(comment: Locator): Promise<void> {
  const menuButton = getCommentMenuButton(comment);
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  const pinButton = getCommentPinButton(comment);
  await pinButton.click();
}

export async function hideComment(comment: Locator): Promise<void> {
  const menuButton = getCommentMenuButton(comment);
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
  }
  const hideButton = getCommentHideButton(comment);
  await hideButton.click();
}

// Assertion helpers

export async function assertCommentVisible(page: Page, text: string): Promise<void> {
  const comment = getCommentByText(page, text);
  await expect(comment).toBeVisible();
}

export async function assertCommentNotVisible(page: Page, text: string): Promise<void> {
  const comment = getCommentByText(page, text);
  await expect(comment).not.toBeVisible();
}

export async function assertCommentCount(page: Page, count: number): Promise<void> {
  const countElement = getCommentCount(page);
  await expect(countElement).toContainText(count.toString());
}

export async function assertCommentPinned(comment: Locator): Promise<void> {
  const badge = getPinnedBadge(comment);
  await expect(badge).toBeVisible();
}

export async function assertCommentUpvoted(comment: Locator): Promise<void> {
  const upvoteButton = getCommentUpvoteButton(comment);
  // Check for active/pressed state
  await expect(upvoteButton).toHaveAttribute("aria-pressed", "true").or(
    expect(upvoteButton).toHaveClass(/active|selected|pressed/)
  );
}

export async function assertReplyVisible(comment: Locator, text: string): Promise<void> {
  const replies = getReplies(comment);
  await expect(replies.filter({ hasText: text })).toBeVisible();
}

// Utility functions

export function generateUniqueComment(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `Test comment ${timestamp}-${random}`;
}

export function generateLongComment(length: number = 2000): string {
  const base = "This is a test comment for length validation. ";
  return base.repeat(Math.ceil(length / base.length)).substring(0, length);
}
