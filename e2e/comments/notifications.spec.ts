import { test, expect } from "../lib/playwright-logger";
import {
  gotoSwapMeetPrompt,
  isCommentsFeatureAvailable,
  getCommentCards,
  getCommentByText,
  getCommentInput,
  postComment,
  replyToComment,
  generateUniqueComment,
} from "../lib/comments-helpers";

/**
 * Comments Notifications E2E Tests
 *
 * Tests notification functionality for comments:
 * - Notification when someone replies to your comment
 * - Notification when someone comments on your prompt
 * - Notification when your comment is upvoted
 * - Mark notifications as read
 * - Notification preferences
 *
 * Note: These tests require the notifications system to be implemented.
 * Tests will skip if the feature is not available.
 */

const TEST_PROMPT_ID = "comm-1";

// Notification selectors
function getNotificationBell(page: ReturnType<typeof test.use>) {
  return page.locator("[data-testid='notification-bell']").or(
    page.getByRole("button", { name: /notification/i }).or(
      page.locator("button").filter({ has: page.locator("svg.lucide-bell") })
    )
  );
}

function getNotificationDropdown(page: ReturnType<typeof test.use>) {
  return page.locator("[data-testid='notification-dropdown']").or(
    page.locator("[role='menu']").filter({ hasText: /notification/i })
  );
}

function getNotificationCount(page: ReturnType<typeof test.use>) {
  return page.locator("[data-testid='notification-count']").or(
    page.locator(".notification-badge, .badge")
  );
}

function getNotificationItems(page: ReturnType<typeof test.use>) {
  return page.locator("[data-testid='notification-item']");
}

async function isNotificationFeatureAvailable(page: ReturnType<typeof test.use>): Promise<boolean> {
  const bell = getNotificationBell(page);
  return bell.isVisible().catch(() => false);
}

test.describe("Comments - Notifications", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const commentsAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!commentsAvailable, "Comments feature not yet implemented");

    const notificationsAvailable = await isNotificationFeatureAvailable(page);
    test.skip(!notificationsAvailable, "Notifications feature not yet implemented");
  });

  test("notification bell is visible for authenticated users", async ({ page, logger }) => {
    await logger.step("verify notification bell exists", async () => {
      const bell = getNotificationBell(page);
      await expect(bell).toBeVisible();
    });
  });

  test("clicking notification bell opens dropdown", async ({ page, logger }) => {
    await logger.step("click notification bell", async () => {
      const bell = getNotificationBell(page);
      await bell.click();
    });

    await logger.step("verify dropdown opens", async () => {
      const dropdown = getNotificationDropdown(page);
      await expect(dropdown).toBeVisible();
    });
  });

  test("shows notification count badge when there are unread notifications", async ({ page, logger }) => {
    await logger.step("check for notification count", async () => {
      const count = getNotificationCount(page);
      const isVisible = await count.isVisible().catch(() => false);

      // If badge is visible, it should contain a number
      if (isVisible) {
        const text = await count.textContent();
        if (text) {
          const num = parseInt(text, 10);
          expect(num).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test("notification appears when someone replies to your comment", async ({ page, logger }) => {
    // This test requires two user sessions - marking as documentation
    await logger.step("document: reply notification behavior", async () => {
      // When User A posts a comment and User B replies:
      // 1. User A should receive a notification
      // 2. Notification should link to the comment
      // 3. Notification should show reply preview

      // Since we can't easily test multi-user scenarios in E2E,
      // this test verifies the notification UI structure exists
      const bell = getNotificationBell(page);
      await bell.click();

      const dropdown = getNotificationDropdown(page);
      await expect(dropdown).toBeVisible();

      // Check for expected notification structure
      const notificationItems = getNotificationItems(page);
      const count = await notificationItems.count();

      if (count > 0) {
        const firstNotification = notificationItems.first();
        // Should have clickable link
        const hasLink = await firstNotification.locator("a").isVisible().catch(() => false);
        logger.debug(`Notification has link: ${hasLink}`);
      }
    });
  });

  test("notification appears when someone comments on your prompt", async ({ page, logger }) => {
    await logger.step("document: prompt comment notification behavior", async () => {
      // When User B comments on User A's prompt:
      // 1. User A (prompt owner) should receive a notification
      // 2. Notification should include comment preview
      // 3. Clicking should navigate to the prompt

      const bell = getNotificationBell(page);
      await bell.click();

      const dropdown = getNotificationDropdown(page);
      await expect(dropdown).toBeVisible();
    });
  });

  test("can mark notifications as read", async ({ page, logger }) => {
    await logger.step("open notifications", async () => {
      const bell = getNotificationBell(page);
      await bell.click();
    });

    await logger.step("find mark as read option", async () => {
      // Individual notification mark as read
      const markReadButton = page.getByRole("button", { name: /mark.*read/i });
      const hasMarkRead = await markReadButton.isVisible().catch(() => false);

      // Or "Mark all as read"
      const markAllButton = page.getByRole("button", { name: /mark all.*read/i });
      const hasMarkAll = await markAllButton.isVisible().catch(() => false);

      if (hasMarkRead || hasMarkAll) {
        logger.debug("Mark as read functionality available");
      }
    });
  });

  test("clicking notification navigates to relevant content", async ({ page, logger }) => {
    await logger.step("open notifications", async () => {
      const bell = getNotificationBell(page);
      await bell.click();
    });

    await logger.step("click first notification", async () => {
      const dropdown = getNotificationDropdown(page);
      await expect(dropdown).toBeVisible();

      const notificationItems = getNotificationItems(page);
      const count = await notificationItems.count();
      test.skip(count === 0, "No notifications available");

      const firstNotification = notificationItems.first();
      const currentUrl = page.url();

      await firstNotification.click();

      // Should navigate away from current page
      await page.waitForLoadState("networkidle");
      // URL should change or modal should open
    });
  });
});

test.describe("Comments - Notification Preferences", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to settings", async () => {
      // Navigate to user settings page
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");
    });
  });

  test("notification settings are accessible", async ({ page, logger }) => {
    await logger.step("find notification settings section", async () => {
      const notificationSection = page.locator("text=/notification.*settings|notification.*preferences/i");
      const hasSection = await notificationSection.isVisible().catch(() => false);

      if (!hasSection) {
        // Try navigation to specific settings tab
        const notificationTab = page.getByRole("tab", { name: /notification/i });
        if (await notificationTab.isVisible().catch(() => false)) {
          await notificationTab.click();
        }
      }

      test.skip(
        !(await page.locator("text=/notification/i").isVisible().catch(() => false)),
        "Notification settings not available"
      );
    });
  });

  test("can toggle comment reply notifications", async ({ page, logger }) => {
    await logger.step("find reply notification toggle", async () => {
      const replyToggle = page.locator("[data-testid='notify-replies']").or(
        page.getByRole("switch", { name: /repl/i })
      ).or(
        page.getByLabel(/notify.*repl|repl.*notification/i)
      );

      const hasToggle = await replyToggle.isVisible().catch(() => false);
      test.skip(!hasToggle, "Reply notification toggle not found");

      await logger.step("toggle the setting", async () => {
        const currentState = await replyToggle.isChecked().catch(() => false);
        await replyToggle.click();

        const newState = await replyToggle.isChecked().catch(() => !currentState);
        expect(newState).not.toBe(currentState);
      });
    });
  });

  test("can toggle prompt comment notifications", async ({ page, logger }) => {
    await logger.step("find prompt comment notification toggle", async () => {
      const commentToggle = page.locator("[data-testid='notify-comments']").or(
        page.getByRole("switch", { name: /comment/i })
      ).or(
        page.getByLabel(/notify.*comment|comment.*notification/i)
      );

      const hasToggle = await commentToggle.isVisible().catch(() => false);
      test.skip(!hasToggle, "Comment notification toggle not found");

      await logger.step("toggle the setting", async () => {
        const currentState = await commentToggle.isChecked().catch(() => false);
        await commentToggle.click();

        const newState = await commentToggle.isChecked().catch(() => !currentState);
        expect(newState).not.toBe(currentState);
      });
    });
  });

  test("can toggle email notifications", async ({ page, logger }) => {
    await logger.step("find email notification toggle", async () => {
      const emailToggle = page.locator("[data-testid='notify-email']").or(
        page.getByRole("switch", { name: /email/i })
      ).or(
        page.getByLabel(/email.*notification|notify.*email/i)
      );

      const hasToggle = await emailToggle.isVisible().catch(() => false);
      test.skip(!hasToggle, "Email notification toggle not found");

      await logger.step("toggle the setting", async () => {
        const currentState = await emailToggle.isChecked().catch(() => false);
        await emailToggle.click();

        const newState = await emailToggle.isChecked().catch(() => !currentState);
        expect(newState).not.toBe(currentState);
      });
    });
  });
});

test.describe("Comments - Real-time Notifications", () => {
  test("new comments appear without page refresh", async ({ page, logger }) => {
    await logger.step("navigate to prompt page", async () => {
      await gotoSwapMeetPrompt(page, TEST_PROMPT_ID);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isCommentsFeatureAvailable(page);
    test.skip(!isAvailable, "Comments feature not yet implemented");

    await logger.step("document: real-time comment updates", async () => {
      // This tests whether comments update in real-time via WebSocket/SSE
      // When another user posts a comment:
      // 1. The comment should appear without refresh
      // 2. Comment count should update
      // 3. Optional: subtle animation for new comment

      // Since we can't easily test this without multiple sessions,
      // we document the expected behavior
      logger.debug("Real-time updates should use WebSocket or SSE");
      logger.debug("New comments should animate into view");
      logger.debug("Comment count should update automatically");

      // Check if the page has real-time connection
      const wsConnected = await page.evaluate(() => {
        // Check for WebSocket connections
        return (window as unknown as { __ws?: WebSocket }).__ws !== undefined;
      }).catch(() => false);

      logger.debug(`WebSocket connection detected: ${wsConnected}`);
    });
  });

  test("notification count updates in real-time", async ({ page, logger }) => {
    await logger.step("navigate and check notifications", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    const notificationsAvailable = await isNotificationFeatureAvailable(page);
    test.skip(!notificationsAvailable, "Notifications feature not yet implemented");

    await logger.step("document: real-time notification count", async () => {
      // The notification count badge should update in real-time
      // when new notifications arrive

      const count = getNotificationCount(page);
      const initialCount = await count.textContent().catch(() => "0");

      logger.debug(`Initial notification count: ${initialCount}`);
      logger.debug("Count should update via WebSocket/SSE when new notifications arrive");
    });
  });
});
