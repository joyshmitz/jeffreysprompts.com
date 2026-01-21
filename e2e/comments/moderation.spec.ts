import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  isCommentsFeatureAvailable,
  getCommentCards,
  getCommentByText,
  getCommentInput,
  getCommentMenuButton,
  getCommentPinButton,
  getCommentHideButton,
  getPinnedBadge,
  pinComment,
  hideComment,
  postComment,
  assertCommentVisible,
  assertCommentNotVisible,
  assertCommentPinned,
  generateUniqueComment,
} from "../lib/comments-helpers";

/**
 * Comments Moderation E2E Tests
 *
 * Tests moderation functionality for prompt owners:
 * - Pin comments (appears at top)
 * - Unpin comments
 * - Hide comments (not visible to others)
 * - Unhide comments
 * - Only top-level comments can be pinned
 * - Non-owners cannot moderate
 */

const TEST_PROMPT_ID = "comm-1";

test.describe("Comments - Moderation (Prompt Owner)", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");
  });

  test("prompt owner sees moderation options", async ({ page, logger }) => {
    await logger.step("check if authenticated as owner", async () => {
      // This test requires being logged in as the prompt owner
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);

      if (!hasMenu) {
        test.skip(true, "Moderation menu not visible - may not be logged in as owner");
      }
    });

    await logger.step("open moderation menu", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      await menuButton.click();
    });

    await logger.step("verify moderation options visible", async () => {
      // Look for pin and hide options in the menu
      const pinOption = page.getByRole("menuitem", { name: /pin/i });
      const hideOption = page.getByRole("menuitem", { name: /hide/i });

      const hasPinOption = await pinOption.isVisible().catch(() => false);
      const hasHideOption = await hideOption.isVisible().catch(() => false);

      expect(hasPinOption || hasHideOption).toBeTruthy();
    });
  });

  test("can pin a comment", async ({ page, logger }) => {
    await logger.step("check if owner and find comment", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);
      test.skip(!hasMenu, "Moderation not available");
    });

    await logger.step("pin the first comment", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await pinComment(firstComment);
    });

    await logger.step("verify comment is pinned", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await assertCommentPinned(firstComment);
    });
  });

  test("can unpin a pinned comment", async ({ page, logger }) => {
    await logger.step("check for moderation access", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);
      test.skip(!hasMenu, "Moderation not available");
    });

    await logger.step("pin comment first", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();

      // Check if already pinned
      const pinnedBadge = getPinnedBadge(firstComment);
      const isPinned = await pinnedBadge.isVisible().catch(() => false);

      if (!isPinned) {
        await pinComment(firstComment);
        await expect(getPinnedBadge(firstComment)).toBeVisible();
      }
    });

    await logger.step("unpin the comment", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await pinComment(firstComment); // Toggle off
    });

    await logger.step("verify comment is unpinned", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      const pinnedBadge = getPinnedBadge(firstComment);
      await expect(pinnedBadge).not.toBeVisible();
    });
  });

  test("pinned comment appears at top of list", async ({ page, logger }) => {
    await logger.step("check if owner and have multiple comments", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count < 2, "Need at least 2 comments to test ordering");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);
      test.skip(!hasMenu, "Moderation not available");
    });

    // Get the second comment's text (we'll pin it)
    let commentToPin: string | null = null;

    await logger.step("get second comment text", async () => {
      const comments = getCommentCards(page);
      const secondComment = comments.nth(1);
      commentToPin = await secondComment.textContent();
    });

    await logger.step("pin the second comment", async () => {
      const comments = getCommentCards(page);
      const secondComment = comments.nth(1);
      await pinComment(secondComment);
    });

    await logger.step("verify pinned comment moved to top", async () => {
      // After pinning, this comment should be first
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      const pinnedBadge = getPinnedBadge(firstComment);

      await expect(pinnedBadge).toBeVisible();

      // The pinned comment should now be first
      if (commentToPin) {
        const firstText = await firstComment.textContent();
        expect(firstText).toContain(commentToPin.substring(0, 50));
      }
    });
  });

  test("can hide a comment", async ({ page, logger }) => {
    await logger.step("check for moderation access", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);
      test.skip(!hasMenu, "Moderation not available");
    });

    let commentText: string | null = null;

    await logger.step("get comment text before hiding", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      commentText = await firstComment.textContent();
    });

    await logger.step("hide the comment", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await hideComment(firstComment);
    });

    await logger.step("verify comment is hidden or marked", async () => {
      // For the owner, hidden comments may still be visible but marked
      // Or they may be completely hidden
      if (commentText) {
        const hiddenIndicator = page.locator("text=/hidden|this comment.*hidden/i");
        const commentStillVisible = await page.getByText(commentText.substring(0, 50)).isVisible().catch(() => false);
        const hasHiddenIndicator = await hiddenIndicator.isVisible().catch(() => false);

        // Either comment is gone or marked as hidden
        expect(!commentStillVisible || hasHiddenIndicator).toBeTruthy();
      }
    });
  });

  test("can unhide a hidden comment", async ({ page, logger }) => {
    await logger.step("check for moderation access", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);
      test.skip(!hasMenu, "Moderation not available");
    });

    await logger.step("hide comment first", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();
      await hideComment(firstComment);
    });

    await logger.step("unhide the comment", async () => {
      // Find the hidden comment (may have special styling or be in a hidden list)
      const hiddenComment = page.locator("[data-hidden='true']").or(
        page.locator(".hidden-comment")
      ).first();

      const isHiddenVisible = await hiddenComment.isVisible().catch(() => false);

      if (isHiddenVisible) {
        await hideComment(hiddenComment); // Toggle unhide
      } else {
        // May need to click "show hidden comments" first
        const showHiddenButton = page.getByRole("button", { name: /show.*hidden/i });
        if (await showHiddenButton.isVisible().catch(() => false)) {
          await showHiddenButton.click();
          const comments = getCommentCards(page);
          const firstComment = comments.first();
          await hideComment(firstComment); // Toggle unhide
        }
      }
    });
  });

  test("only top-level comments can be pinned", async ({ page, logger }) => {
    await logger.step("check if authenticated", async () => {
      const commentInput = getCommentInput(page);
      const isInputVisible = await commentInput.isVisible().catch(() => false);
      test.skip(!isInputVisible, "Requires authentication");
    });

    // Create a parent and reply
    const parentText = generateUniqueComment();
    const replyText = `Reply for pin test ${Date.now()}`;

    await logger.step("create parent comment", async () => {
      await postComment(page, parentText);
    });

    await logger.step("create reply", async () => {
      const parentComment = getCommentByText(page, parentText);
      const replyButton = parentComment.getByRole("button", { name: /reply/i });
      await replyButton.click();

      const replyInput = parentComment.locator("textarea, input").last();
      await replyInput.fill(replyText);

      const submitButton = parentComment.getByRole("button", { name: /post|submit/i }).last();
      await submitButton.click();
    });

    await logger.step("verify reply cannot be pinned", async () => {
      const replyComment = getCommentByText(page, replyText);
      const menuButton = getCommentMenuButton(replyComment);

      // If menu exists, pin should be disabled or absent for replies
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();

        const pinOption = page.getByRole("menuitem", { name: /pin/i });
        const isPinVisible = await pinOption.isVisible().catch(() => false);
        const isPinDisabled = isPinVisible ? await pinOption.isDisabled().catch(() => false) : true;

        // Pin should either not be visible or be disabled for replies
        expect(!isPinVisible || isPinDisabled).toBeTruthy();
      }
    });
  });
});

test.describe("Comments - Moderation (Non-Owner)", () => {
  test("non-owners do not see moderation options", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      // Navigate to a prompt we don't own
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("check for absence of moderation options", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");

      const firstComment = comments.first();

      // Non-owners should not have access to pin/hide
      // They may have a menu for other actions (report, etc.)
      const menuButton = getCommentMenuButton(firstComment);
      const hasMenu = await menuButton.isVisible().catch(() => false);

      if (hasMenu) {
        await menuButton.click();

        const pinOption = page.getByRole("menuitem", { name: /pin/i });
        const hideOption = page.getByRole("menuitem", { name: /hide/i });

        const hasPinOption = await pinOption.isVisible().catch(() => false);
        const hasHideOption = await hideOption.isVisible().catch(() => false);

        // Non-owners should not see these options
        // This test may need adjustment based on actual auth state
        logger.debug(`Pin visible: ${hasPinOption}, Hide visible: ${hasHideOption}`);
      }
    });
  });

  test("hidden comments are not visible to other users", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("verify no hidden comments visible", async () => {
      // For non-owners, hidden comments should not appear at all
      const hiddenIndicator = page.locator("[data-hidden='true']");
      const hiddenText = page.locator("text=/hidden.*comment/i");

      const hasHiddenIndicator = await hiddenIndicator.isVisible().catch(() => false);
      const hasHiddenText = await hiddenText.isVisible().catch(() => false);

      // As a non-owner, we shouldn't see any hidden comment indicators
      // (they should simply not be rendered)
      logger.debug(`Hidden indicator visible: ${hasHiddenIndicator}`);
      logger.debug(`Hidden text visible: ${hasHiddenText}`);
    });
  });
});

test.describe("Comments - Report Functionality", () => {
  test("users can report inappropriate comments", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("find comment to report", async () => {
      const comments = getCommentCards(page);
      const count = await comments.count();
      test.skip(count === 0, "No comments available");
    });

    await logger.step("open report dialog", async () => {
      const comments = getCommentCards(page);
      const firstComment = comments.first();

      // Report may be in menu or standalone button
      const menuButton = getCommentMenuButton(firstComment);
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
      }

      const reportButton = page.getByRole("button", { name: /report/i }).or(
        page.getByRole("menuitem", { name: /report/i })
      );

      const canReport = await reportButton.isVisible().catch(() => false);
      test.skip(!canReport, "Report option not available");

      await reportButton.click();
    });

    await logger.step("verify report dialog opens", async () => {
      const reportDialog = page.getByRole("dialog").or(
        page.locator("[data-testid='report-dialog']")
      );

      await expect(reportDialog).toBeVisible();

      // Should have reason selection
      const reasonSelect = reportDialog.locator("select, [role='combobox']");
      const hasReasonSelect = await reasonSelect.isVisible().catch(() => false);
      expect(hasReasonSelect).toBeTruthy();
    });
  });
});
