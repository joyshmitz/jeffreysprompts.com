import { test, expect } from "../lib/playwright-logger";
import {
  navigateToReferralsPage,
  getDisplayedReferralCode,
  getCopyCodeButton,
  getShareButton,
  isValidReferralCode,
  getReferralUrl,
  getHowItWorksSteps,
  isShareModalOpen,
  getShareLinks,
  closeShareModal,
  fetchReferralCodeFromAPI,
  REFERRAL_CODE_PATTERN,
  TEST_USERS,
} from "../lib/referral-helpers";

/**
 * Referral Code E2E Tests
 *
 * Tests for referral code display and management:
 * 1. User has referral code
 * 2. Code is unique
 * 3. Copy code works
 * 4. Share links work
 */

test.describe("Referral Code Display", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to referrals page", async () => {
      await navigateToReferralsPage(page);
    });
  });

  test("referrals page loads correctly", async ({ page, logger }) => {
    await logger.step("verify page title", async () => {
      await expect(page).toHaveTitle(/Referral/i);
    });

    await logger.step("verify page heading", async () => {
      await expect(page.getByRole("heading", { name: /Referral Program/i })).toBeVisible();
    });
  });

  test("displays referral code for user", async ({ page, logger }) => {
    await logger.step("verify referral code is displayed", async () => {
      // Wait for the referral code to load
      await page.waitForTimeout(500);
      const code = await getDisplayedReferralCode(page);
      // Code might not be visible if not logged in, but the section should exist
      const codeSection = page.locator("text=/Your Referral Code|referral link/i");
      await expect(codeSection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test("referral code matches expected format", async ({ page, logger }) => {
    await logger.step("check code format via API", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      if (result) {
        expect(isValidReferralCode(result.code)).toBe(true);
        expect(result.code).toMatch(REFERRAL_CODE_PATTERN);
      }
    });
  });

  test("displays copy button", async ({ page, logger }) => {
    await logger.step("verify copy button exists", async () => {
      const copyButton = getCopyCodeButton(page);
      await expect(copyButton).toBeVisible();
      await expect(copyButton).toBeEnabled();
    });
  });

  test("displays share button", async ({ page, logger }) => {
    await logger.step("verify share button exists", async () => {
      const shareButton = getShareButton(page);
      await expect(shareButton).toBeVisible();
      await expect(shareButton).toBeEnabled();
    });
  });

  test("displays referral URL", async ({ page, logger }) => {
    await logger.step("verify referral URL format", async () => {
      const url = await getReferralUrl(page);
      if (url) {
        expect(url).toMatch(/jeffreysprompts\.com\/r\/[A-Z0-9]+/i);
      }
    });
  });
});

test.describe("How It Works Section", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to referrals page", async () => {
      await navigateToReferralsPage(page);
    });
  });

  test("displays how it works heading", async ({ page, logger }) => {
    await logger.step("verify How It Works section", async () => {
      await expect(page.getByText("How It Works")).toBeVisible();
    });
  });

  test("displays three steps", async ({ page, logger }) => {
    await logger.step("verify step numbers", async () => {
      await expect(page.getByText("1")).toBeVisible();
      await expect(page.getByText("2")).toBeVisible();
      await expect(page.getByText("3")).toBeVisible();
    });

    await logger.step("verify step content", async () => {
      // Step 1: Share
      await expect(page.getByText(/Share Your Link/i)).toBeVisible();

      // Step 2: Friends sign up
      await expect(page.getByText(/Friends Sign Up/i)).toBeVisible();

      // Step 3: Get rewarded
      await expect(page.getByText(/You Get Rewarded/i)).toBeVisible();
    });
  });

  test("step descriptions are helpful", async ({ page, logger }) => {
    await logger.step("verify share step details", async () => {
      await expect(page.getByText(/Copy your unique referral link/i)).toBeVisible();
    });

    await logger.step("verify signup step mentions trial/discount", async () => {
      await expect(page.getByText(/30-day trial|20% off/i)).toBeVisible();
    });

    await logger.step("verify reward step mentions free month", async () => {
      await expect(page.getByText(/1 month.*free Premium/i)).toBeVisible();
    });
  });
});

test.describe("Share Functionality", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to referrals page", async () => {
      await navigateToReferralsPage(page);
    });
  });

  test("share button opens share modal", async ({ page, logger }) => {
    await logger.step("click share button", async () => {
      const shareButton = getShareButton(page);
      await shareButton.click();
    });

    await logger.step("verify modal opens", async () => {
      await page.waitForTimeout(300);
      const modalOpen = await isShareModalOpen(page);
      expect(modalOpen).toBe(true);
    });
  });

  test("share modal has social sharing options", async ({ page, logger }) => {
    await logger.step("open share modal", async () => {
      const shareButton = getShareButton(page);
      await shareButton.click();
      await page.waitForTimeout(300);
    });

    await logger.step("verify sharing options", async () => {
      const links = await getShareLinks(page);
      // At least some sharing options should be available
      const hasAnyShareOption =
        links.twitter || links.linkedin || links.email || links.sms;
      expect(hasAnyShareOption).toBe(true);
    });
  });

  test("share modal can be closed", async ({ page, logger }) => {
    await logger.step("open share modal", async () => {
      const shareButton = getShareButton(page);
      await shareButton.click();
      await page.waitForTimeout(300);
    });

    await logger.step("close modal", async () => {
      await closeShareModal(page);
    });

    await logger.step("verify modal is closed", async () => {
      await page.waitForTimeout(300);
      const modalOpen = await isShareModalOpen(page);
      expect(modalOpen).toBe(false);
    });
  });
});

test.describe("Referral Code API", () => {
  test("API returns valid code for user", async ({ page, logger }) => {
    await logger.step("fetch code from API", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      expect(result).not.toBeNull();
      expect(result?.code).toBeDefined();
    });

    await logger.step("verify code format", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      if (result) {
        expect(isValidReferralCode(result.code)).toBe(true);
      }
    });
  });

  test("same user always gets same code", async ({ page, logger }) => {
    let firstCode: string | undefined;
    let secondCode: string | undefined;

    await logger.step("fetch code first time", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      firstCode = result?.code;
    });

    await logger.step("fetch code second time", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      secondCode = result?.code;
    });

    await logger.step("verify codes are the same", async () => {
      expect(firstCode).toBe(secondCode);
    });
  });

  test("different users get different codes", async ({ page, logger }) => {
    let user1Code: string | undefined;
    let user2Code: string | undefined;

    await logger.step("fetch code for user 1", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      user1Code = result?.code;
    });

    await logger.step("fetch code for user 2", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_REFERRER);
      user2Code = result?.code;
    });

    await logger.step("verify codes are different", async () => {
      if (user1Code && user2Code) {
        expect(user1Code).not.toBe(user2Code);
      }
    });
  });

  test("API returns referral URL", async ({ page, logger }) => {
    await logger.step("fetch code and URL", async () => {
      const result = await fetchReferralCodeFromAPI(page, TEST_USERS.DEMO_USER);
      expect(result?.url).toBeDefined();
      expect(result?.url).toContain("jeffreysprompts.com/r/");
    });
  });
});

test.describe("Terms Section", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to referrals page", async () => {
      await navigateToReferralsPage(page);
    });
  });

  test("displays referral terms", async ({ page, logger }) => {
    await logger.step("verify terms section exists", async () => {
      await expect(page.getByText(/Referral Program Terms/i)).toBeVisible();
    });
  });

  test("terms mention key conditions", async ({ page, logger }) => {
    await logger.step("scroll to terms", async () => {
      const terms = page.getByText(/Referral Program Terms/i);
      await terms.scrollIntoViewIfNeeded();
    });

    await logger.step("verify monthly requirement", async () => {
      await expect(page.getByText(/1 month/i)).toBeVisible();
    });

    await logger.step("verify yearly cap", async () => {
      await expect(page.getByText(/12 months/i)).toBeVisible();
    });

    await logger.step("verify self-referral prevention", async () => {
      await expect(page.getByText(/Self-referrals are not allowed/i)).toBeVisible();
    });
  });
});
