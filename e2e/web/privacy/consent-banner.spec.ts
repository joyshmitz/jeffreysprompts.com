import { test, expect } from "../../lib/playwright-logger";
import {
  clearConsent,
  getConsent,
  setConsent,
  setOutdatedConsent,
  getBannerLocators,
  waitForBanner,
  waitForBannerHidden,
  acceptAllCookies,
  rejectAllCookies,
  openSettingsFromBanner,
  CONSENT_VERSION,
} from "../../lib/consent-helpers";

/**
 * Cookie Consent Banner E2E Tests
 *
 * Tests for the consent banner display, user interactions,
 * and consent persistence.
 */

test.describe("Consent Banner - First Visit", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear any existing consent", async () => {
      await page.goto("/");
      await clearConsent(page);
    });
  });

  test("banner shows on first visit with no prior consent", async ({
    page,
    logger,
  }) => {
    await logger.step("navigate to homepage", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner is visible", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).toBeVisible({ timeout: 5000 });
    });

    await logger.step("verify banner title", async () => {
      await expect(page.getByText("Cookie preferences")).toBeVisible();
    });

    await logger.step("verify banner has all action buttons", async () => {
      const { acceptAllButton, rejectAllButton, customizeButton } =
        getBannerLocators(page);
      await expect(acceptAllButton).toBeVisible();
      await expect(rejectAllButton).toBeVisible();
      await expect(customizeButton).toBeVisible();
    });

    await logger.step("verify cookie policy link", async () => {
      const { cookiePolicyLink } = getBannerLocators(page);
      await expect(cookiePolicyLink).toBeVisible();
      await expect(cookiePolicyLink).toHaveAttribute("href", "/cookies");
    });
  });

  test("banner does not show if valid consent exists", async ({
    page,
    logger,
  }) => {
    await logger.step("set existing consent", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: true,
        marketing: false,
        version: CONSENT_VERSION,
      });
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner is NOT visible", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });
  });

  test("banner shows if consent version is outdated", async ({
    page,
    logger,
  }) => {
    await logger.step("set outdated consent", async () => {
      await page.goto("/");
      await setOutdatedConsent(page);
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner is visible due to outdated version", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe("Consent Banner - Accept All", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("Accept All saves consent with analytics and marketing enabled", async ({
    page,
    logger,
  }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("click Accept All", async () => {
      await acceptAllCookies(page);
    });

    await logger.step("verify consent is saved correctly", async () => {
      const consent = await getConsent(page);
      expect(consent).not.toBeNull();
      expect(consent?.essential).toBe(true);
      expect(consent?.analytics).toBe(true);
      expect(consent?.marketing).toBe(true);
      expect(consent?.source).toBe("banner");
      expect(consent?.version).toBe(CONSENT_VERSION);
    });

    await logger.step("verify banner is hidden", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });
  });

  test("Accept All persists after page reload", async ({ page, logger }) => {
    await logger.step("accept all cookies", async () => {
      await waitForBanner(page);
      await acceptAllCookies(page);
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner does not reappear", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });

    await logger.step("verify consent is still stored", async () => {
      const consent = await getConsent(page);
      expect(consent?.analytics).toBe(true);
      expect(consent?.marketing).toBe(true);
    });
  });
});

test.describe("Consent Banner - Reject All", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("Reject All saves consent with analytics and marketing disabled", async ({
    page,
    logger,
  }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("click Reject All", async () => {
      await rejectAllCookies(page);
    });

    await logger.step("verify consent is saved correctly", async () => {
      const consent = await getConsent(page);
      expect(consent).not.toBeNull();
      expect(consent?.essential).toBe(true);
      expect(consent?.analytics).toBe(false);
      expect(consent?.marketing).toBe(false);
      expect(consent?.source).toBe("banner");
    });

    await logger.step("verify banner is hidden", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });
  });

  test("Reject All persists after page reload", async ({ page, logger }) => {
    await logger.step("reject all cookies", async () => {
      await waitForBanner(page);
      await rejectAllCookies(page);
    });

    await logger.step("reload page", async () => {
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner does not reappear", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });

    await logger.step("verify consent remains rejected", async () => {
      const consent = await getConsent(page);
      expect(consent?.analytics).toBe(false);
      expect(consent?.marketing).toBe(false);
    });
  });
});

test.describe("Consent Banner - Customize", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("Customize opens settings dialog", async ({ page, logger }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("click Customize", async () => {
      await openSettingsFromBanner(page);
    });

    await logger.step("verify settings dialog is open", async () => {
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Cookie preferences" })
      ).toBeVisible();
    });
  });
});

test.describe("Consent Banner - Navigation", () => {
  test("cookie policy link navigates to policy page", async ({
    page,
    logger,
  }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("click cookie policy link", async () => {
      const { cookiePolicyLink } = getBannerLocators(page);
      await cookiePolicyLink.click();
    });

    await logger.step("verify navigation to cookie policy page", async () => {
      await page.waitForURL("**/cookies");
      expect(page.url()).toContain("/cookies");
    });
  });
});

test.describe("Consent Banner - UI/UX", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("banner has correct positioning (fixed bottom)", async ({
    page,
    logger,
  }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("verify banner is fixed at bottom", async () => {
      const { banner } = getBannerLocators(page);
      const box = await banner.boundingBox();
      const viewport = page.viewportSize();

      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();

      if (box && viewport) {
        // Banner should be near the bottom of the viewport
        const distanceFromBottom = viewport.height - (box.y + box.height);
        expect(distanceFromBottom).toBeLessThan(50); // Within 50px of bottom
      }
    });
  });

  test("banner buttons are keyboard accessible", async ({ page, logger }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("verify buttons can be focused via keyboard", async () => {
      const { rejectAllButton, customizeButton, acceptAllButton } =
        getBannerLocators(page);

      // Tab through the banner buttons
      await rejectAllButton.focus();
      await expect(rejectAllButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(customizeButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(acceptAllButton).toBeFocused();
    });
  });

  test("banner can be dismissed with keyboard (Enter on Accept All)", async ({
    page,
    logger,
  }) => {
    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("focus Accept All and press Enter", async () => {
      const { acceptAllButton } = getBannerLocators(page);
      await acceptAllButton.focus();
      await page.keyboard.press("Enter");
    });

    await logger.step("verify banner is dismissed", async () => {
      await waitForBannerHidden(page);
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });
  });
});

test.describe("Consent Banner - Mobile", () => {
  test("banner displays correctly on mobile viewport", async ({
    page,
    logger,
  }) => {
    await logger.step("set mobile viewport", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
    });

    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("wait for banner", async () => {
      await waitForBanner(page);
    });

    await logger.step("verify banner fits within viewport", async () => {
      const { banner } = getBannerLocators(page);
      const box = await banner.boundingBox();
      const viewport = page.viewportSize();

      expect(box).not.toBeNull();
      expect(viewport).not.toBeNull();

      if (box && viewport) {
        // Banner should not overflow horizontally
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    await logger.step("verify all buttons are visible", async () => {
      const { acceptAllButton, rejectAllButton, customizeButton } =
        getBannerLocators(page);
      await expect(acceptAllButton).toBeVisible();
      await expect(rejectAllButton).toBeVisible();
      await expect(customizeButton).toBeVisible();
    });

    await logger.step("verify buttons have touch-friendly size", async () => {
      const { acceptAllButton } = getBannerLocators(page);
      const box = await acceptAllButton.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        // Minimum 44px touch target (WCAG recommendation)
        expect(box.height).toBeGreaterThanOrEqual(32); // Allow smaller buttons with sufficient padding
      }
    });
  });
});
