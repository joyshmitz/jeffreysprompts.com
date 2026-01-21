import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper functions for Following & Activity Feed E2E tests
 *
 * Following API (premium feature):
 * - GET /api/users/:username/followers - List followers
 * - GET /api/users/:username/following - List following
 * - POST /api/users/:username/follow - Follow user
 * - DELETE /api/users/:username/follow - Unfollow user
 *
 * Activity Feed API:
 * - GET /api/feed - Get activity feed (authenticated)
 * - GET /api/feed/following - Get following activity
 */

// Navigation helpers

export async function gotoUserProfile(page: Page, username: string): Promise<void> {
  await page.goto(`/users/${username}`, { waitUntil: "networkidle", timeout: 60000 });
}

export async function gotoActivityFeed(page: Page): Promise<void> {
  await page.goto("/feed", { waitUntil: "networkidle", timeout: 60000 });
}

export async function gotoFollowersPage(page: Page, username: string): Promise<void> {
  await page.goto(`/users/${username}/followers`, { waitUntil: "networkidle", timeout: 60000 });
}

export async function gotoFollowingPage(page: Page, username: string): Promise<void> {
  await page.goto(`/users/${username}/following`, { waitUntil: "networkidle", timeout: 60000 });
}

// Feature detection

export async function isFollowingFeatureAvailable(page: Page): Promise<boolean> {
  const followButton = getFollowButton(page);
  const followersCount = getFollowersCount(page);
  const followingCount = getFollowingCount(page);

  const [hasFollowButton, hasFollowersCount, hasFollowingCount] = await Promise.all([
    followButton.isVisible().catch(() => false),
    followersCount.isVisible().catch(() => false),
    followingCount.isVisible().catch(() => false),
  ]);

  return hasFollowButton || hasFollowersCount || hasFollowingCount;
}

export async function isActivityFeedAvailable(page: Page): Promise<boolean> {
  const feedSection = getActivityFeedSection(page);
  const feedItems = getActivityFeedItems(page);

  const [hasFeedSection, hasFeedItems] = await Promise.all([
    feedSection.isVisible().catch(() => false),
    feedItems.count().then((count) => count > 0).catch(() => false),
  ]);

  return hasFeedSection || hasFeedItems;
}

// Profile selectors

export function getFollowButton(page: Page): Locator {
  return page.locator("[data-testid='follow-button']").or(
    page.getByRole("button", { name: /follow/i }).filter({
      hasNot: page.locator(":has-text('following'), :has-text('unfollow')"),
    })
  );
}

export function getUnfollowButton(page: Page): Locator {
  return page.locator("[data-testid='unfollow-button']").or(
    page.getByRole("button", { name: /unfollow|following/i })
  );
}

export function getFollowersCount(page: Page): Locator {
  return page.locator("[data-testid='followers-count']").or(
    page.locator("text=/\\d+.*followers?/i")
  );
}

export function getFollowingCount(page: Page): Locator {
  return page.locator("[data-testid='following-count']").or(
    page.locator("text=/\\d+.*following/i")
  );
}

export function getFollowersLink(page: Page): Locator {
  return page.locator("[data-testid='followers-link']").or(
    page.getByRole("link", { name: /followers/i })
  );
}

export function getFollowingLink(page: Page): Locator {
  return page.locator("[data-testid='following-link']").or(
    page.getByRole("link", { name: /following/i })
  );
}

// User list selectors (for followers/following pages)

export function getUserList(page: Page): Locator {
  return page.locator("[data-testid='user-list']").or(
    page.locator("ul, ol").filter({ has: page.locator("[data-testid='user-card']") })
  );
}

export function getUserCards(page: Page): Locator {
  return page.locator("[data-testid='user-card']").or(
    page.locator("li, article").filter({ has: page.locator("a[href^='/users/']") })
  );
}

export function getUserCardByUsername(page: Page, username: string): Locator {
  return getUserCards(page).filter({ hasText: username });
}

export function getUserCardFollowButton(card: Locator): Locator {
  return card.getByRole("button", { name: /follow/i });
}

// Activity feed selectors

export function getActivityFeedSection(page: Page): Locator {
  return page.locator("[data-testid='activity-feed']").or(
    page.locator("main, section").filter({ hasText: /activity|feed/i })
  );
}

export function getActivityFeedItems(page: Page): Locator {
  return page.locator("[data-testid='activity-item']").or(
    page.locator("article, li").filter({
      has: page.locator("[data-testid='activity-content'], .activity-content"),
    })
  );
}

export function getActivityItemByType(page: Page, type: string): Locator {
  return getActivityFeedItems(page).filter({
    has: page.locator(`[data-activity-type='${type}']`),
  });
}

export function getActivityAuthor(item: Locator): Locator {
  return item.locator("[data-testid='activity-author']").or(
    item.locator("a[href^='/users/']").first()
  );
}

export function getActivityContent(item: Locator): Locator {
  return item.locator("[data-testid='activity-content']").or(
    item.locator("p, span").first()
  );
}

export function getActivityTimestamp(item: Locator): Locator {
  return item.locator("[data-testid='activity-timestamp']").or(
    item.locator("time, [datetime]")
  );
}

export function getActivityLink(item: Locator): Locator {
  return item.locator("[data-testid='activity-link']").or(
    item.locator("a[href^='/prompts/'], a[href^='/swap-meet/']").first()
  );
}

// Feed filters

export function getFeedFilterSelect(page: Page): Locator {
  return page.locator("[data-testid='feed-filter']").or(
    page.getByRole("combobox", { name: /filter|type/i })
  );
}

export function getFeedFilterOption(page: Page, option: string): Locator {
  const labels: Record<string, RegExp> = {
    all: /all/i,
    prompts: /prompts?/i,
    collections: /collections?/i,
    following: /following/i,
  };
  return page.getByRole("option", { name: labels[option] || new RegExp(option, "i") });
}

export function getDateRangeFilter(page: Page): Locator {
  return page.locator("[data-testid='date-range-filter']").or(
    page.getByRole("combobox", { name: /date|time|period/i })
  );
}

export function getLoadMoreButton(page: Page): Locator {
  return page.getByRole("button", { name: /load more|show more|see more/i });
}

export function getEmptyFeedMessage(page: Page): Locator {
  return page.locator("[data-testid='empty-feed']").or(
    page.locator("text=/no activity|nothing here|start following/i")
  );
}

// Notifications

export function getNewFollowerNotification(page: Page): Locator {
  return page.locator("[data-testid='follower-notification']").or(
    page.locator("text=/started following you|new follower/i")
  );
}

export function getFollowNotificationToggle(page: Page): Locator {
  return page.locator("[data-testid='follow-notification-toggle']").or(
    page.getByRole("switch", { name: /follow.*notification|notify.*follow/i })
  );
}

// Action helpers

export async function followUser(page: Page): Promise<void> {
  const followButton = getFollowButton(page);
  await followButton.click();
  // Wait for button state to change
  await expect(getUnfollowButton(page)).toBeVisible({ timeout: 5000 });
}

export async function unfollowUser(page: Page): Promise<void> {
  const unfollowButton = getUnfollowButton(page);
  await unfollowButton.click();
  // Handle confirmation if present
  const confirmButton = page.getByRole("button", { name: /confirm|yes|unfollow/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
  // Wait for button state to change
  await expect(getFollowButton(page)).toBeVisible({ timeout: 5000 });
}

export async function followUserFromCard(card: Locator): Promise<void> {
  const followButton = getUserCardFollowButton(card);
  await followButton.click();
}

export async function loadMoreActivity(page: Page): Promise<number> {
  const loadMoreButton = getLoadMoreButton(page);
  const beforeCount = await getActivityFeedItems(page).count();
  await loadMoreButton.click();
  // Wait for new items to load
  await page.waitForTimeout(1000);
  const afterCount = await getActivityFeedItems(page).count();
  return afterCount - beforeCount;
}

export async function filterActivityFeed(page: Page, filterType: string): Promise<void> {
  const filterSelect = getFeedFilterSelect(page);
  await filterSelect.click();
  const option = getFeedFilterOption(page, filterType);
  await option.click();
}

// Assertion helpers

export async function assertIsFollowing(page: Page): Promise<void> {
  const unfollowButton = getUnfollowButton(page);
  await expect(unfollowButton).toBeVisible();
}

export async function assertIsNotFollowing(page: Page): Promise<void> {
  const followButton = getFollowButton(page);
  await expect(followButton).toBeVisible();
}

export async function assertFollowersCount(page: Page, count: number): Promise<void> {
  const followersCount = getFollowersCount(page);
  await expect(followersCount).toContainText(count.toString());
}

export async function assertFollowingCount(page: Page, count: number): Promise<void> {
  const followingCount = getFollowingCount(page);
  await expect(followingCount).toContainText(count.toString());
}

export async function assertUserInList(page: Page, username: string): Promise<void> {
  const userCard = getUserCardByUsername(page, username);
  await expect(userCard).toBeVisible();
}

export async function assertUserNotInList(page: Page, username: string): Promise<void> {
  const userCard = getUserCardByUsername(page, username);
  await expect(userCard).not.toBeVisible();
}

export async function assertActivityVisible(page: Page, contentMatch: string | RegExp): Promise<void> {
  const items = getActivityFeedItems(page);
  const matchingItem = items.filter({ hasText: contentMatch });
  await expect(matchingItem).toBeVisible();
}

export async function assertActivityCount(page: Page, minCount: number): Promise<void> {
  const items = getActivityFeedItems(page);
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}

export async function assertEmptyFeed(page: Page): Promise<void> {
  const emptyMessage = getEmptyFeedMessage(page);
  await expect(emptyMessage).toBeVisible();
}

// Utility functions

export function generateTestUsername(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `testuser_${timestamp}_${random}`;
}

export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    prompt_published: "published a prompt",
    prompt_updated: "updated a prompt",
    collection_shared: "shared a collection",
    user_followed: "started following",
    prompt_saved: "saved a prompt",
    prompt_rated: "rated a prompt",
  };
  return labels[type] || type;
}

/**
 * Wait for activity feed to update (useful after actions that should trigger new activity)
 */
export async function waitForActivityUpdate(page: Page, timeout: number = 5000): Promise<void> {
  const startTime = Date.now();
  const initialCount = await getActivityFeedItems(page).count();

  while (Date.now() - startTime < timeout) {
    await page.waitForTimeout(500);
    const currentCount = await getActivityFeedItems(page).count();
    if (currentCount > initialCount) {
      return;
    }
  }
}
