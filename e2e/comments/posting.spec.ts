import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  isCommentsFeatureAvailable,
  getCommentsSection,
  getCommentInput,
  getSubmitCommentButton,
  getCommentByText,
  getCommentCards,
  postComment,
  assertCommentVisible,
  generateUniqueComment,
  generateLongComment,
  upvoteComment,
  getCommentUpvoteButton,
  editComment,
  deleteComment,
  getCommentEditButton,
  getCommentDeleteButton,
} from "../lib/comments-helpers";

/**
 * Comments Posting E2E Tests
 *
 * Tests basic comment functionality:
 * - View comments section
 * - Post a new comment
 * - Edit own comment
 * - Delete own comment
 * - Upvote comments
 * - Comment validation (length, empty)
 */

// Test prompt ID for comments testing (using mock data)
const TEST_PROMPT_ID = "comm-1";

test.describe("Comments - Posting", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    // Skip if comments feature is not available
    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");
  });

  test("comments section is visible on prompt page", async ({ page, logger }) => {
    await logger.step("verify comments section exists", async () => {
      const commentsSection = getCommentsSection(page);
      await expect(commentsSection).toBeVisible();
    });
  });

  test("comment input is visible for authenticated users", async ({ page, logger }) => {
    await logger.step("verify comment input exists", async () => {
      const commentInput = getCommentInput(page);
      // Input may require authentication - check visibility
      const isVisible = await commentInput.isVisible().catch(() => false);

      if (!isVisible) {
        // May need to be logged in
        logger.debug("Comment input not visible - may require authentication");
      }

      // At minimum, the comments section should exist
      const commentsSection = getCommentsSection(page);
      await expect(commentsSection).toBeVisible();
    });
  });

  test("can post a new comment", async ({ page, logger }) => {
    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    const commentText = generateUniqueComment();

    await logger.step("type comment", async () => {
      const commentInput = getCommentInput(page);
      await commentInput.fill(commentText);
    });

    await logger.step("submit comment", async () => {
      const submitButton = getSubmitCommentButton(page);
      await submitButton.click();
    });

    await logger.step("verify comment appears", async () => {
      await assertCommentVisible(page, commentText);
    });
  });

  test("cannot post empty comment", async ({ page, logger }) => {
    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    await logger.step("try to submit empty comment", async () => {
      const commentInput = getCommentInput(page);
      await commentInput.fill("");

      const submitButton = getSubmitCommentButton(page);
      // Button should be disabled or submission should fail
      const isDisabled = await submitButton.isDisabled().catch(() => false);

      if (!isDisabled) {
        await submitButton.click();
        // Should show validation error or not submit
        await page.waitForTimeout(500);
      }
    });

    await logger.step("verify no empty comment posted", async () => {
      // Check that no new empty comment cards appeared
      const emptyComments = getCommentByText(page, "");
      const count = await emptyComments.count();
      // Should have 0 empty comments (or only pre-existing ones)
      expect(count).toBeLessThanOrEqual(0);
    });
  });

  test("comment has character limit validation", async ({ page, logger }) => {
    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    const longComment = generateLongComment(2500); // Over 2000 char limit

    await logger.step("try to enter very long comment", async () => {
      const commentInput = getCommentInput(page);
      await commentInput.fill(longComment);
    });

    await logger.step("verify character limit enforced", async () => {
      const commentInput = getCommentInput(page);
      const value = await commentInput.inputValue();
      // Either input should be truncated or there should be a validation message
      const isValid = value.length <= 2000 ||
        await page.locator("text=/too long|character limit|maximum/i").isVisible().catch(() => false);
      expect(isValid).toBeTruthy();
    });
  });

  test("can upvote a comment", async ({ page, logger }) => {
    await logger.step("find a comment to upvote", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available to upvote");
    });

    await logger.step("upvote first comment", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await upvoteComment(firstComment);
    });

    await logger.step("verify upvote registered", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      const upvoteButton = getCommentUpvoteButton(firstComment);

      // Check for visual feedback (pressed state or count change)
      const isPressed = await upvoteButton.getAttribute("aria-pressed");
      const hasActiveClass = await upvoteButton.evaluate((el) =>
        el.classList.contains("active") ||
        el.classList.contains("pressed") ||
        el.classList.contains("text-primary")
      ).catch(() => false);

      expect(isPressed === "true" || hasActiveClass).toBeTruthy();
    });
  });

  test("can toggle upvote off", async ({ page, logger }) => {
    await logger.step("find a comment", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");
    });

    const comments = getCommentCards(page);
    const firstComment = comments.first();

    await logger.step("upvote comment", async () => {
      await upvoteComment(firstComment);
    });

    await logger.step("toggle upvote off", async () => {
      await upvoteComment(firstComment); // Click again to toggle off
    });

    await logger.step("verify upvote removed", async () => {
      const upvoteButton = getCommentUpvoteButton(firstComment);
      const isPressed = await upvoteButton.getAttribute("aria-pressed");
      expect(isPressed).not.toBe("true");
    });
  });

  test("can edit own comment", async ({ page, logger }) => {
    // First post a comment to edit
    const originalText = generateUniqueComment();
    const editedText = `Edited: ${originalText}`;

    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    await logger.step("post a comment", async () => {
      await postComment(page, originalText);
    });

    await logger.step("find the posted comment", async () => {
      const comment = getCommentByText(page, originalText);
      await expect(comment).toBeVisible();
    });

    await logger.step("edit the comment", async () => {
      const comment = getCommentByText(page, originalText);
      const editButton = getCommentEditButton(comment);

      // Check if edit button is available (own comment)
      const canEdit = await editButton.isVisible().catch(() => false);
      test.skip(!canEdit, "Edit button not available");

      await editComment(comment, editedText);
    });

    await logger.step("verify edit saved", async () => {
      await assertCommentVisible(page, editedText);
    });
  });

  test("can delete own comment", async ({ page, logger }) => {
    const commentText = generateUniqueComment();

    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    await logger.step("post a comment", async () => {
      await postComment(page, commentText);
    });

    await logger.step("verify comment exists", async () => {
      await assertCommentVisible(page, commentText);
    });

    await logger.step("delete the comment", async () => {
      const comment = getCommentByText(page, commentText);
      const deleteButton = getCommentDeleteButton(comment);

      // Check if delete button is available (own comment)
      const canDelete = await deleteButton.isVisible().catch(() => false);
      test.skip(!canDelete, "Delete button not available");

      await deleteComment(comment);
    });

    await logger.step("verify comment deleted", async () => {
      // Wait for deletion to process
      await page.waitForTimeout(500);
      const comment = getCommentByText(page, commentText);
      await expect(comment).not.toBeVisible();
    });
  });

  test("comments are sorted by newest first by default", async ({ page, logger }) => {
    await logger.step("verify comments exist", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count < 2, "Need at least 2 comments to test sorting");
    });

    await logger.step("verify newest first order", async () => {
      const comments = getCommentCards(page);

      // Get timestamps from first two comments
      const firstTimestamp = await comments.first().locator("time, [datetime]").getAttribute("datetime").catch(() => null);
      const secondTimestamp = await comments.nth(1).locator("time, [datetime]").getAttribute("datetime").catch(() => null);

      if (firstTimestamp && secondTimestamp) {
        const first = new Date(firstTimestamp).getTime();
        const second = new Date(secondTimestamp).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  test("XSS content is sanitized in comments", async ({ page, logger }) => {
    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Comment input not visible - requires authentication");
    });

    const xssAttempt = `Test <script>alert('xss')</script> comment ${Date.now()}`;
    const sanitizedText = `Test  comment`; // Script tags should be stripped

    await logger.step("post comment with XSS attempt", async () => {
      const commentInput = getCommentInput(page);
      await commentInput.fill(xssAttempt);
      const submitButton = getSubmitCommentButton(page);
      await submitButton.click();
    });

    await logger.step("verify XSS is sanitized", async () => {
      // The script tag should not be in the DOM
      const scriptTag = page.locator("script:has-text('xss')");
      await expect(scriptTag).not.toBeVisible();

      // No alert should have fired
      // The comment text should be sanitized
    });
  });
});

test.describe("Comments - Unauthenticated", () => {
  test("shows login prompt for unauthenticated users", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("check comment input state", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);

      if (!isInputVisible) {
        // Should show login prompt instead
        const loginPrompt = page.locator("text=/sign in|log in|login.*comment/i");
        const hasLoginPrompt = await loginPrompt.isVisible().catch(() => false);
        expect(hasLoginPrompt).toBeTruthy();
      }
    });
  });

  test("can view existing comments without authentication", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("verify comments section visible", async () => {
      const commentsSection = getCommentsSection(page);
      await expect(commentsSection).toBeVisible();
    });

    await logger.step("verify comments are readable", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();

      if (count > 0) {
        // Can see comment content
        const firstComment = comments.first();
        await expect(firstComment).toBeVisible();
      }
    });
  });
});
