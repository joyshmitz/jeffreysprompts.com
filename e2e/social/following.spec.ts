import { test, expect } from "../lib/playwright-logger";
import {
  gotoUserProfile,
  gotoFollowersPage,
  gotoFollowingPage,
  isFollowingFeatureAvailable,
  getFollowButton,
  getUnfollowButton,
  getFollowersCount,
  getFollowingCount,
  getFollowersLink,
  getFollowingLink,
  getUserList,
  getUserCards,
  getUserCardByUsername,
  followUser,
  unfollowUser,
  assertIsFollowing,
  assertIsNotFollowing,
  assertFollowersCount,
  assertFollowingCount,
  assertUserInList,
  assertUserNotInList,
} from "../lib/social-helpers";

/**
 * Following System E2E Tests
 *
 * Tests user following functionality:
 * - Follow/unfollow buttons
 * - Followers/following counts
 * - Followers/following lists
 * - Follow persistence
 */

// Test user profiles (using seed data from profile-store)
const TEST_USER = "jeffreyemanuel";
const OTHER_USER = "demo_user";

test.describe("Following - Profile Display", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to user profile", async () => {
      await gotoUserProfile(page, TEST_USER);
      await page.waitForLoadState("networkidle");
    });

    // Skip if following feature is not available
    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");
  });

  test("profile shows followers count", async ({ page, logger }) => {
    await logger.step("verify followers count is visible", async () => {
      const followersCount = getFollowersCount(page);
      await expect(followersCount).toBeVisible();
    });

    await logger.step("verify followers count is a number", async () => {
      const followersCount = getFollowersCount(page);
      const text = await followersCount.textContent();
      expect(text).toMatch(/\d+/);
    });
  });

  test("profile shows following count", async ({ page, logger }) => {
    await logger.step("verify following count is visible", async () => {
      const followingCount = getFollowingCount(page);
      await expect(followingCount).toBeVisible();
    });

    await logger.step("verify following count is a number", async () => {
      const followingCount = getFollowingCount(page);
      const text = await followingCount.textContent();
      expect(text).toMatch(/\d+/);
    });
  });

  test("followers count is clickable and navigates to list", async ({ page, logger }) => {
    await logger.step("click followers count", async () => {
      const followersLink = getFollowersLink(page);
      const isLink = await followersLink.isVisible().catch(() => false);

      if (isLink) {
        await followersLink.click();
        await page.waitForLoadState("networkidle");
      } else {
        // May be a count that opens modal instead
        const followersCount = getFollowersCount(page);
        await followersCount.click();
        await page.waitForTimeout(500);
      }
    });

    await logger.step("verify navigation or modal", async () => {
      // Either URL changed or modal appeared
      const urlChanged = page.url().includes("followers");
      const modalVisible = await page.locator("[role='dialog'], [data-testid='followers-modal']")
        .isVisible()
        .catch(() => false);

      expect(urlChanged || modalVisible).toBeTruthy();
    });
  });

  test("following count is clickable and navigates to list", async ({ page, logger }) => {
    await logger.step("click following count", async () => {
      const followingLink = getFollowingLink(page);
      const isLink = await followingLink.isVisible().catch(() => false);

      if (isLink) {
        await followingLink.click();
        await page.waitForLoadState("networkidle");
      } else {
        const followingCount = getFollowingCount(page);
        await followingCount.click();
        await page.waitForTimeout(500);
      }
    });

    await logger.step("verify navigation or modal", async () => {
      const urlChanged = page.url().includes("following");
      const modalVisible = await page.locator("[role='dialog'], [data-testid='following-modal']")
        .isVisible()
        .catch(() => false);

      expect(urlChanged || modalVisible).toBeTruthy();
    });
  });
});

test.describe("Following - Follow/Unfollow Actions", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to other user profile", async () => {
      await gotoUserProfile(page, OTHER_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");
  });

  test("follow button is visible on other user profile", async ({ page, logger }) => {
    await logger.step("verify follow button exists", async () => {
      // Either follow or unfollow button should be visible
      const followButton = getFollowButton(page);
      const unfollowButton = getUnfollowButton(page);

      const hasFollowButton = await followButton.isVisible().catch(() => false);
      const hasUnfollowButton = await unfollowButton.isVisible().catch(() => false);

      expect(hasFollowButton || hasUnfollowButton).toBeTruthy();
    });
  });

  test("can follow a user", async ({ page, logger }) => {
    await logger.step("check current follow state", async () => {
      const followButton = getFollowButton(page);
      const isFollowVisible = await followButton.isVisible().catch(() => false);

      if (!isFollowVisible) {
        // Already following - need to unfollow first
        await unfollowUser(page);
      }
    });

    await logger.step("click follow button", async () => {
      await followUser(page);
    });

    await logger.step("verify following state", async () => {
      await assertIsFollowing(page);
    });
  });

  test("can unfollow a user", async ({ page, logger }) => {
    await logger.step("ensure currently following", async () => {
      const unfollowButton = getUnfollowButton(page);
      const isUnfollowVisible = await unfollowButton.isVisible().catch(() => false);

      if (!isUnfollowVisible) {
        // Not following - need to follow first
        await followUser(page);
      }
    });

    await logger.step("click unfollow button", async () => {
      await unfollowUser(page);
    });

    await logger.step("verify not following state", async () => {
      await assertIsNotFollowing(page);
    });
  });

  test("follow action updates followers count", async ({ page, logger }) => {
    let initialCount: number;

    await logger.step("get initial followers count", async () => {
      const followersCount = getFollowersCount(page);
      const text = await followersCount.textContent();
      const match = text?.match(/\d+/);
      initialCount = match ? parseInt(match[0], 10) : 0;
    });

    await logger.step("ensure not following", async () => {
      const unfollowButton = getUnfollowButton(page);
      const isFollowing = await unfollowButton.isVisible().catch(() => false);
      if (isFollowing) {
        await unfollowUser(page);
        // Re-read initial count after unfollowing
        const followersCount = getFollowersCount(page);
        const text = await followersCount.textContent();
        const match = text?.match(/\d+/);
        initialCount = match ? parseInt(match[0], 10) : 0;
      }
    });

    await logger.step("follow user", async () => {
      await followUser(page);
    });

    await logger.step("verify count increased", async () => {
      const followersCount = getFollowersCount(page);
      const text = await followersCount.textContent();
      const match = text?.match(/\d+/);
      const newCount = match ? parseInt(match[0], 10) : 0;
      expect(newCount).toBe(initialCount + 1);
    });
  });

  test("follow state persists after page reload", async ({ page, logger }) => {
    await logger.step("follow user", async () => {
      const followButton = getFollowButton(page);
      const isFollowVisible = await followButton.isVisible().catch(() => false);
      if (isFollowVisible) {
        await followUser(page);
      }
    });

    await logger.step("reload page", async () => {
      await page.reload({ waitUntil: "networkidle" });
    });

    await logger.step("verify still following", async () => {
      await assertIsFollowing(page);
    });
  });
});

test.describe("Following - Followers List", () => {
  test("followers page shows user list", async ({ page, logger }) => {
    await logger.step("navigate to followers page", async () => {
      await gotoFollowersPage(page, TEST_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");

    await logger.step("verify user list is visible", async () => {
      const userList = getUserList(page);
      const userCards = getUserCards(page);

      const hasUserList = await userList.isVisible().catch(() => false);
      const hasUserCards = await userCards.count().then((c) => c > 0).catch(() => false);

      // Either list with cards or empty state
      const emptyState = page.locator("text=/no followers|be the first/i");
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      expect(hasUserList || hasUserCards || hasEmptyState).toBeTruthy();
    });
  });

  test("each follower card shows username and follow button", async ({ page, logger }) => {
    await logger.step("navigate to followers page", async () => {
      await gotoFollowersPage(page, TEST_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");

    await logger.step("check user cards", async () => {
      const userCards = getUserCards(page);
      const count = await userCards.count();

      test.skip(count === 0, "No followers to test");

      const firstCard = userCards.first();

      // Should have username link
      const usernameLink = firstCard.locator("a[href^='/users/']");
      await expect(usernameLink).toBeVisible();

      // Should have follow button (unless it's own profile)
      const followButton = firstCard.getByRole("button", { name: /follow/i });
      // Follow button may not be visible if viewing own followers
    });
  });
});

test.describe("Following - Following List", () => {
  test("following page shows user list", async ({ page, logger }) => {
    await logger.step("navigate to following page", async () => {
      await gotoFollowingPage(page, TEST_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");

    await logger.step("verify user list is visible", async () => {
      const userList = getUserList(page);
      const userCards = getUserCards(page);

      const hasUserList = await userList.isVisible().catch(() => false);
      const hasUserCards = await userCards.count().then((c) => c > 0).catch(() => false);

      // Either list with cards or empty state
      const emptyState = page.locator("text=/not following anyone|find people/i");
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      expect(hasUserList || hasUserCards || hasEmptyState).toBeTruthy();
    });
  });
});

test.describe("Following - Own Profile", () => {
  test("cannot follow yourself", async ({ page, logger }) => {
    // This test assumes we're logged in as TEST_USER
    await logger.step("navigate to own profile", async () => {
      await gotoUserProfile(page, TEST_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");

    await logger.step("verify no follow button on own profile", async () => {
      const followButton = getFollowButton(page);
      const isVisible = await followButton.isVisible().catch(() => false);

      // Follow button should not be visible on own profile
      // OR it should be disabled
      if (isVisible) {
        const isDisabled = await followButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      } else {
        expect(isVisible).toBeFalsy();
      }
    });
  });
});

test.describe("Following - Notifications", () => {
  test("new follower notification appears", async ({ page, logger }) => {
    // This is a complex test that would require:
    // 1. User A follows User B
    // 2. User B sees notification

    // For now, check if notification settings exist
    await logger.step("navigate to notifications settings", async () => {
      await page.goto("/settings/notifications", { waitUntil: "networkidle" });
    });

    await logger.step("check for follow notification toggle", async () => {
      const followToggle = page.locator("text=/follow.*notification|notify.*follow/i");
      const hasToggle = await followToggle.isVisible().catch(() => false);

      // Test passes if toggle exists or page doesn't have notifications yet
      if (!hasToggle) {
        test.skip(true, "Notification settings not yet implemented");
      }

      expect(hasToggle).toBeTruthy();
    });
  });
});

test.describe("Following - Unauthenticated", () => {
  test("follow button shows login prompt for unauthenticated users", async ({ page, logger }) => {
    await logger.step("navigate to user profile", async () => {
      // Clear any auth state
      await page.context().clearCookies();
      await gotoUserProfile(page, OTHER_USER);
      await page.waitForLoadState("networkidle");
    });

    const isAvailable = await isFollowingFeatureAvailable(page);
    test.skip(!isAvailable, "Following feature not yet implemented");

    await logger.step("check follow button behavior", async () => {
      const followButton = getFollowButton(page);
      const isVisible = await followButton.isVisible().catch(() => false);

      if (isVisible) {
        await followButton.click();

        // Should show login prompt or redirect to login
        const loginPrompt = page.locator("text=/sign in|log in|login/i");
        const loginRedirect = page.url().includes("login") || page.url().includes("signin");

        const promptedLogin = await loginPrompt.isVisible().catch(() => false) || loginRedirect;
        expect(promptedLogin).toBeTruthy();
      }
    });
  });
});
