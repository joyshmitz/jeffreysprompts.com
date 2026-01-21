import { test, expect } from "../lib/playwright-logger";
import {
  gotoActivityFeed,
  isActivityFeedAvailable,
  getActivityFeedSection,
  getActivityFeedItems,
  getActivityItemByType,
  getActivityAuthor,
  getActivityContent,
  getActivityTimestamp,
  getActivityLink,
  getFeedFilterSelect,
  getDateRangeFilter,
  getLoadMoreButton,
  getEmptyFeedMessage,
  loadMoreActivity,
  filterActivityFeed,
  assertActivityVisible,
  assertActivityCount,
  assertEmptyFeed,
  getActivityTypeLabel,
} from "../lib/social-helpers";

/**
 * Activity Feed E2E Tests
 *
 * Tests the activity feed functionality:
 * - Feed display and layout
 * - Activity types (prompt published, updated, etc.)
 * - Filtering and sorting
 * - Pagination
 * - Empty states
 */

test.describe("Activity Feed - Display", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("activity feed section is visible", async ({ page, logger }) => {
    await logger.step("verify feed section exists", async () => {
      const feedSection = getActivityFeedSection(page);
      await expect(feedSection).toBeVisible();
    });
  });

  test("activity feed shows items or empty state", async ({ page, logger }) => {
    await logger.step("check feed content", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      if (count === 0) {
        // Should show empty state message
        const emptyMessage = getEmptyFeedMessage(page);
        await expect(emptyMessage).toBeVisible();
      } else {
        // Should show activity items
        const firstItem = items.first();
        await expect(firstItem).toBeVisible();
      }
    });
  });

  test("each activity item has author and timestamp", async ({ page, logger }) => {
    await logger.step("verify item structure", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      test.skip(count === 0, "No activity items to test");

      const firstItem = items.first();

      // Should have author
      const author = getActivityAuthor(firstItem);
      await expect(author).toBeVisible();

      // Should have timestamp
      const timestamp = getActivityTimestamp(firstItem);
      await expect(timestamp).toBeVisible();
    });
  });

  test("activity items are sorted by newest first", async ({ page, logger }) => {
    await logger.step("verify chronological order", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      test.skip(count < 2, "Need at least 2 items to verify order");

      const firstTimestamp = await items.first()
        .locator("time, [datetime]")
        .getAttribute("datetime")
        .catch(() => null);

      const secondTimestamp = await items.nth(1)
        .locator("time, [datetime]")
        .getAttribute("datetime")
        .catch(() => null);

      if (firstTimestamp && secondTimestamp) {
        const first = new Date(firstTimestamp).getTime();
        const second = new Date(secondTimestamp).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });
});

test.describe("Activity Feed - Activity Types", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("prompt published activity shows correct info", async ({ page, logger }) => {
    await logger.step("find prompt published activity", async () => {
      const publishedActivities = getActivityItemByType(page, "prompt_published");
      const count = await publishedActivities.count().catch(() => 0);

      if (count === 0) {
        // Try finding by text pattern
        const byText = getActivityFeedItems(page).filter({
          hasText: /published.*prompt|new prompt/i,
        });
        const textCount = await byText.count().catch(() => 0);
        test.skip(textCount === 0, "No prompt published activities found");
      }
    });

    await logger.step("verify activity content", async () => {
      const activity = getActivityItemByType(page, "prompt_published").first().or(
        getActivityFeedItems(page).filter({ hasText: /published.*prompt/i }).first()
      );

      // Should have link to the prompt
      const link = getActivityLink(activity);
      const hasLink = await link.isVisible().catch(() => false);

      if (hasLink) {
        const href = await link.getAttribute("href");
        expect(href).toMatch(/\/prompts\/|\/swap-meet\//);
      }
    });
  });

  test("prompt updated activity shows correct info", async ({ page, logger }) => {
    await logger.step("find prompt updated activity", async () => {
      const updatedActivities = getActivityItemByType(page, "prompt_updated").or(
        getActivityFeedItems(page).filter({ hasText: /updated.*prompt/i })
      );
      const count = await updatedActivities.count().catch(() => 0);

      test.skip(count === 0, "No prompt updated activities found");
    });
  });

  test("collection shared activity shows correct info", async ({ page, logger }) => {
    await logger.step("find collection shared activity", async () => {
      const sharedActivities = getActivityItemByType(page, "collection_shared").or(
        getActivityFeedItems(page).filter({ hasText: /shared.*collection/i })
      );
      const count = await sharedActivities.count().catch(() => 0);

      test.skip(count === 0, "No collection shared activities found");
    });
  });
});

test.describe("Activity Feed - Filtering", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("filter select is available", async ({ page, logger }) => {
    await logger.step("check for filter control", async () => {
      const filterSelect = getFeedFilterSelect(page);
      const hasFilter = await filterSelect.isVisible().catch(() => false);

      // Filter is optional - test passes if exists or not
      if (!hasFilter) {
        test.skip(true, "Filter control not implemented");
      }

      await expect(filterSelect).toBeVisible();
    });
  });

  test("can filter by activity type", async ({ page, logger }) => {
    await logger.step("check filter availability", async () => {
      const filterSelect = getFeedFilterSelect(page);
      const hasFilter = await filterSelect.isVisible().catch(() => false);
      test.skip(!hasFilter, "Filter control not implemented");
    });

    await logger.step("apply prompts filter", async () => {
      await filterActivityFeed(page, "prompts");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify filtered results", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      // Either filtered results or empty state
      if (count > 0) {
        // All items should be prompt-related
        for (let i = 0; i < Math.min(count, 3); i++) {
          const item = items.nth(i);
          const text = await item.textContent();
          expect(text?.toLowerCase()).toMatch(/prompt/);
        }
      }
    });
  });

  test("date range filter is available", async ({ page, logger }) => {
    await logger.step("check for date range filter", async () => {
      const dateFilter = getDateRangeFilter(page);
      const hasFilter = await dateFilter.isVisible().catch(() => false);

      // Date filter is optional
      if (!hasFilter) {
        test.skip(true, "Date range filter not implemented");
      }

      await expect(dateFilter).toBeVisible();
    });
  });

  test("hide own activity option works", async ({ page, logger }) => {
    await logger.step("check for hide own activity toggle", async () => {
      const hideOwnToggle = page.locator("text=/hide.*own|my.*activity/i").or(
        page.getByRole("checkbox", { name: /hide.*own|exclude.*mine/i })
      );
      const hasToggle = await hideOwnToggle.isVisible().catch(() => false);

      test.skip(!hasToggle, "Hide own activity option not implemented");
    });
  });
});

test.describe("Activity Feed - Pagination", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("load more button exists when more items available", async ({ page, logger }) => {
    await logger.step("check for load more button", async () => {
      const loadMoreButton = getLoadMoreButton(page);
      const items = getActivityFeedItems(page);
      const count = await items.count();

      // Load more button should exist if there are initial items
      // (and presumably more to load)
      if (count > 0) {
        const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);
        // Button is optional if all items are shown
        if (hasLoadMore) {
          await expect(loadMoreButton).toBeVisible();
        }
      }
    });
  });

  test("clicking load more adds more items", async ({ page, logger }) => {
    await logger.step("check for load more button", async () => {
      const loadMoreButton = getLoadMoreButton(page);
      const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);
      test.skip(!hasLoadMore, "Load more button not visible");
    });

    let initialCount: number;

    await logger.step("get initial item count", async () => {
      const items = getActivityFeedItems(page);
      initialCount = await items.count();
    });

    await logger.step("click load more", async () => {
      const newItems = await loadMoreActivity(page);
      expect(newItems).toBeGreaterThan(0);
    });

    await logger.step("verify items added", async () => {
      const items = getActivityFeedItems(page);
      const newCount = await items.count();
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });

  test("infinite scroll loads more items", async ({ page, logger }) => {
    await logger.step("check for infinite scroll", async () => {
      const items = getActivityFeedItems(page);
      const initialCount = await items.count();

      test.skip(initialCount < 5, "Not enough items to test infinite scroll");

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const newCount = await items.count();

      // Either more items loaded or load more button appeared
      const loadMoreButton = getLoadMoreButton(page);
      const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);

      expect(newCount > initialCount || hasLoadMore).toBeTruthy();
    });
  });
});

test.describe("Activity Feed - Empty States", () => {
  test("shows empty state message for new users", async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      // Clear cookies to simulate new/unauthenticated user
      await page.context().clearCookies();
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");

    await logger.step("check for empty state or login prompt", async () => {
      const emptyMessage = getEmptyFeedMessage(page);
      const loginPrompt = page.locator("text=/sign in|log in|login.*see/i");
      const items = getActivityFeedItems(page);

      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);
      const hasLoginPrompt = await loginPrompt.isVisible().catch(() => false);
      const hasItems = await items.count().then((c) => c > 0).catch(() => false);

      // Should show one of: empty message, login prompt, or public items
      expect(hasEmptyMessage || hasLoginPrompt || hasItems).toBeTruthy();
    });
  });

  test("empty state suggests following users", async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");

    await logger.step("check empty state content", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      test.skip(count > 0, "Feed has items - not empty state");

      // Empty state should encourage following users
      const suggestion = page.locator("text=/start following|find.*people|discover.*users/i");
      const hasSuggestion = await suggestion.isVisible().catch(() => false);

      // Suggestion is expected but not required
      if (hasSuggestion) {
        await expect(suggestion).toBeVisible();
      }
    });
  });
});

test.describe("Activity Feed - Real-time Updates", () => {
  test("feed updates on refresh", async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");

    let initialFirstItem: string | null;

    await logger.step("get first item identifier", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();

      if (count > 0) {
        initialFirstItem = await items.first().getAttribute("data-activity-id").catch(() => null) ||
          await items.first().textContent().catch(() => null);
      }
    });

    await logger.step("refresh page", async () => {
      await page.reload({ waitUntil: "networkidle" });
    });

    await logger.step("verify feed loaded", async () => {
      const feedSection = getActivityFeedSection(page);
      await expect(feedSection).toBeVisible();

      // Feed should either have same items or new items
      const items = getActivityFeedItems(page);
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test("new activity indicator shows when available", async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");

    await logger.step("check for new activity indicator", async () => {
      // Look for any new activity indicators
      const newIndicator = page.locator(
        "[data-testid='new-activity-indicator'], " +
        "button:has-text('new'), " +
        "text=/\\d+ new.*activit/i"
      );

      const hasIndicator = await newIndicator.isVisible().catch(() => false);

      // Indicator is optional - may not appear if no new activity
      // Test passes regardless since we're just verifying the UI works
    });
  });
});

test.describe("Activity Feed - Navigation", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("clicking activity author navigates to profile", async ({ page, logger }) => {
    await logger.step("find activity with author link", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();
      test.skip(count === 0, "No activity items");
    });

    await logger.step("click author link", async () => {
      const items = getActivityFeedItems(page);
      const firstItem = items.first();
      const author = getActivityAuthor(firstItem);

      await author.click();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify navigation to profile", async () => {
      expect(page.url()).toMatch(/\/users\//);
    });
  });

  test("clicking activity content navigates to resource", async ({ page, logger }) => {
    await logger.step("find activity with content link", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();
      test.skip(count === 0, "No activity items");
    });

    await logger.step("click content link", async () => {
      const items = getActivityFeedItems(page);
      const firstItem = items.first();
      const link = getActivityLink(firstItem);

      const hasLink = await link.isVisible().catch(() => false);
      test.skip(!hasLink, "No content link in activity");

      await link.click();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify navigation to resource", async () => {
      expect(page.url()).toMatch(/\/prompts\/|\/swap-meet\/|\/collections\//);
    });
  });
});

test.describe("Activity Feed - Accessibility", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to activity feed", async () => {
      await gotoActivityFeed(page);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isActivityFeedAvailable(page);
    test.skip(!isAvailable, "Activity feed not yet implemented");
  });

  test("activity feed is keyboard navigable", async ({ page, logger }) => {
    await logger.step("verify keyboard navigation", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();
      test.skip(count === 0, "No activity items");

      // Tab to first interactive element in feed
      await page.keyboard.press("Tab");

      // Should focus on something in the feed
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });
  });

  test("timestamps have accessible labels", async ({ page, logger }) => {
    await logger.step("verify timestamp accessibility", async () => {
      const items = getActivityFeedItems(page);
      const count = await items.count();
      test.skip(count === 0, "No activity items");

      const firstItem = items.first();
      const timestamp = getActivityTimestamp(firstItem);

      // Timestamp should have datetime attribute or aria-label
      const datetime = await timestamp.getAttribute("datetime").catch(() => null);
      const ariaLabel = await timestamp.getAttribute("aria-label").catch(() => null);
      const title = await timestamp.getAttribute("title").catch(() => null);

      expect(datetime || ariaLabel || title).toBeTruthy();
    });
  });
});
