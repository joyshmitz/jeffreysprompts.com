import { test, expect } from "../../lib/playwright-logger";
import {
  clearConsent,
  getConsent,
  setConsent,
  getBannerLocators,
  getSettingsLocators,
  waitForBanner,
  openSettingsFromBanner,
  openSettingsViaEvent,
  setupWithDNT,
  setupWithGPC,
  setupWithAllPrivacySignals,
  isGA4Loaded,
  isPlausibleLoaded,
  CONSENT_VERSION,
} from "../../lib/consent-helpers";

/**
 * Cookie Consent Settings E2E Tests
 *
 * Tests for the settings dialog, per-category toggles,
 * privacy signals (DNT/GPC), and analytics script gating.
 */

test.describe("Consent Settings - Dialog", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test("settings dialog shows all cookie categories", async ({
    page,
    logger,
  }) => {
    await logger.step("open settings from banner", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify Essential cookies section", async () => {
      const { dialog } = getSettingsLocators(page);
      await expect(dialog.getByText("Essential cookies", { exact: true })).toBeVisible();
      await expect(
        dialog.getByText("Required for security, core functionality")
      ).toBeVisible();
    });

    await logger.step("verify Analytics cookies section", async () => {
      const { dialog } = getSettingsLocators(page);
      await expect(dialog.getByText("Analytics cookies")).toBeVisible();
      await expect(
        dialog.getByText("Help us understand usage patterns")
      ).toBeVisible();
    });

    await logger.step("verify Marketing cookies section", async () => {
      const { dialog } = getSettingsLocators(page);
      await expect(dialog.getByText("Marketing cookies")).toBeVisible();
      await expect(
        dialog.getByText("Used for retargeting and social media")
      ).toBeVisible();
    });
  });

  test("Essential toggle is always checked and disabled", async ({
    page,
    logger,
  }) => {
    await logger.step("open settings from banner", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify Essential switch is checked and disabled", async () => {
      const { essentialSwitch } = getSettingsLocators(page);
      await expect(essentialSwitch).toBeChecked();
      await expect(essentialSwitch).toBeDisabled();
    });
  });

  test("Analytics and Marketing toggles are interactive", async ({
    page,
    logger,
  }) => {
    await logger.step("open settings from banner", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify Analytics switch is enabled", async () => {
      const { analyticsSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).toBeEnabled();
    });

    await logger.step("toggle Analytics on", async () => {
      const { analyticsSwitch } = getSettingsLocators(page);
      await analyticsSwitch.click();
      await expect(analyticsSwitch).toBeChecked();
    });

    await logger.step("verify Marketing switch is enabled", async () => {
      const { marketingSwitch } = getSettingsLocators(page);
      await expect(marketingSwitch).toBeEnabled();
    });

    await logger.step("toggle Marketing on", async () => {
      const { marketingSwitch } = getSettingsLocators(page);
      await marketingSwitch.click();
      await expect(marketingSwitch).toBeChecked();
    });
  });

  test("Cancel button closes dialog without saving", async ({
    page,
    logger,
  }) => {
    await logger.step("open settings from banner", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("toggle Analytics on", async () => {
      const { analyticsSwitch } = getSettingsLocators(page);
      await analyticsSwitch.click();
      await expect(analyticsSwitch).toBeChecked();
    });

    await logger.step("click Cancel", async () => {
      const { cancelButton, dialog } = getSettingsLocators(page);
      await cancelButton.click();
      await dialog.waitFor({ state: "hidden" });
    });

    await logger.step("verify no consent was saved", async () => {
      const consent = await getConsent(page);
      expect(consent).toBeNull();
    });

    await logger.step("verify banner is still visible", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).toBeVisible();
    });
  });

  test("Save button saves preferences and closes dialog", async ({
    page,
    logger,
  }) => {
    await logger.step("open settings from banner", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("enable only Analytics", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await analyticsSwitch.click();
      await expect(analyticsSwitch).toBeChecked();
      await expect(marketingSwitch).not.toBeChecked();
    });

    await logger.step("click Save preferences", async () => {
      const { saveButton, dialog } = getSettingsLocators(page);
      await saveButton.click();
      await dialog.waitFor({ state: "hidden" });
    });

    await logger.step("verify consent is saved correctly", async () => {
      const consent = await getConsent(page);
      expect(consent).not.toBeNull();
      expect(consent?.analytics).toBe(true);
      expect(consent?.marketing).toBe(false);
      expect(consent?.source).toBe("settings");
    });

    await logger.step("verify banner is hidden", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });
  });
});

test.describe("Consent Settings - Reopening", () => {
  // TODO: Fix event-based dialog opening after consent is saved
  // The jfp:open-cookie-settings event listener may have timing issues
  test.skip("can reopen settings after initial consent", async ({
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
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("verify banner is not shown", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).not.toBeVisible();
    });

    await logger.step("open settings via event", async () => {
      await openSettingsViaEvent(page);
    });

    await logger.step("verify dialog shows current preferences", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).toBeChecked();
      await expect(marketingSwitch).not.toBeChecked();
    });

    await logger.step("change marketing preference", async () => {
      const { marketingSwitch } = getSettingsLocators(page);
      await marketingSwitch.click();
      await expect(marketingSwitch).toBeChecked();
    });

    await logger.step("save and verify update", async () => {
      const { saveButton, dialog } = getSettingsLocators(page);
      await saveButton.click();
      await dialog.waitFor({ state: "hidden" });

      const consent = await getConsent(page);
      expect(consent?.analytics).toBe(true);
      expect(consent?.marketing).toBe(true);
    });
  });

  // TODO: Fix footer link navigation timing - link clicks may need explicit wait
  test.skip("settings link accessible from footer", async ({ page, logger }) => {
    await logger.step("set consent and reload", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: false,
        marketing: false,
        version: CONSENT_VERSION,
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("scroll to footer", async () => {
      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
    });

    await logger.step("find and click cookie settings link", async () => {
      // Footer has "Cookie Settings" link that navigates to /cookies page
      const cookieLink = page.locator("footer").getByRole("link", { name: "Cookie Settings" });
      await expect(cookieLink).toBeVisible({ timeout: 5000 });
      await cookieLink.click();
    });

    await logger.step("verify navigation to cookie settings page", async () => {
      await page.waitForURL("**/cookies");
      expect(page.url()).toContain("/cookies");
    });

    await logger.step("verify cookie settings page content", async () => {
      await expect(page.getByRole("heading", { name: "Cookie settings" })).toBeVisible();
      await expect(page.getByText("Essential cookies")).toBeVisible();
      await expect(page.getByText("Analytics cookies")).toBeVisible();
    });
  });
});

test.describe("Consent Settings - Privacy Signals (DNT)", () => {
  // Skip: Privacy signal injection via addInitScript is unreliable in E2E tests
  // The navigator properties need to be set before page load but addInitScript
  // timing is inconsistent across browsers and reload scenarios
  test.skip("DNT signal disables toggle controls", async ({ page, logger }) => {
    await logger.step("setup DNT signal", async () => {
      await setupWithDNT(page);
    });

    await logger.step("navigate and clear consent", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open settings", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify privacy signal notice is shown", async () => {
      const { privacySignalNotice } = getSettingsLocators(page);
      await expect(privacySignalNotice).toBeVisible();
    });

    await logger.step("verify Analytics and Marketing switches are disabled", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).toBeDisabled();
      await expect(marketingSwitch).toBeDisabled();
    });

    await logger.step("verify switches default to unchecked", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).not.toBeChecked();
      await expect(marketingSwitch).not.toBeChecked();
    });
  });
});

test.describe("Consent Settings - Privacy Signals (GPC)", () => {
  // Skip: Privacy signal injection via addInitScript is unreliable in E2E tests
  test.skip("GPC signal disables toggle controls", async ({ page, logger }) => {
    await logger.step("setup GPC signal", async () => {
      await setupWithGPC(page);
    });

    await logger.step("navigate and clear consent", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open settings", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify privacy signal notice is shown", async () => {
      const { privacySignalNotice } = getSettingsLocators(page);
      await expect(privacySignalNotice).toBeVisible();
    });

    await logger.step("verify Analytics and Marketing switches are disabled", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).toBeDisabled();
      await expect(marketingSwitch).toBeDisabled();
    });
  });
});

test.describe("Consent Settings - Privacy Signals (Both)", () => {
  // Skip: Privacy signal injection via addInitScript is unreliable in E2E tests
  test.skip("both DNT and GPC signals disable controls", async ({ page, logger }) => {
    await logger.step("setup both privacy signals", async () => {
      await setupWithAllPrivacySignals(page);
    });

    await logger.step("navigate and clear consent", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open settings", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify privacy signal notice is shown", async () => {
      const { privacySignalNotice } = getSettingsLocators(page);
      await expect(privacySignalNotice).toBeVisible();
    });

    await logger.step("verify all optional switches are disabled", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      await expect(analyticsSwitch).toBeDisabled();
      await expect(marketingSwitch).toBeDisabled();
    });
  });

  // Skip: Privacy signal injection via addInitScript is unreliable in E2E tests
  test.skip("privacy signals override stored consent preferences", async ({
    page,
    logger,
  }) => {
    await logger.step("setup GPC signal", async () => {
      await setupWithGPC(page);
    });

    await logger.step("set consent with analytics enabled", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: true,
        marketing: true,
        version: CONSENT_VERSION,
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open settings via event", async () => {
      await openSettingsViaEvent(page);
    });

    await logger.step("verify switches show unchecked despite stored consent", async () => {
      const { analyticsSwitch, marketingSwitch } = getSettingsLocators(page);
      // Privacy signals should override stored preferences in the UI
      await expect(analyticsSwitch).toBeDisabled();
      await expect(marketingSwitch).toBeDisabled();
    });
  });
});

test.describe("Analytics Script Gating", () => {
  test("GA4 script does NOT load when analytics consent is rejected", async ({
    page,
    logger,
  }) => {
    await logger.step("set consent with analytics disabled", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: false,
        marketing: false,
        version: CONSENT_VERSION,
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("wait for page to fully load", async () => {
      // Give time for any scripts to load
      await page.waitForTimeout(2000);
    });

    await logger.step("verify GA4 is NOT loaded", async () => {
      const gaLoaded = await isGA4Loaded(page);
      expect(gaLoaded).toBe(false);
    });
  });

  test("GA4 script does NOT load when DNT is enabled", async ({
    page,
    logger,
  }) => {
    await logger.step("setup DNT signal", async () => {
      await setupWithDNT(page);
    });

    await logger.step("set consent with analytics enabled", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: true, // User said yes, but DNT overrides
        marketing: false,
        version: CONSENT_VERSION,
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("wait for page to fully load", async () => {
      await page.waitForTimeout(2000);
    });

    await logger.step("verify GA4 is NOT loaded despite consent", async () => {
      const gaLoaded = await isGA4Loaded(page);
      expect(gaLoaded).toBe(false);
    });
  });

  test("GA4 script does NOT load when GPC is enabled", async ({
    page,
    logger,
  }) => {
    await logger.step("setup GPC signal", async () => {
      await setupWithGPC(page);
    });

    await logger.step("set consent with analytics enabled", async () => {
      await page.goto("/");
      await setConsent(page, {
        analytics: true, // User said yes, but GPC overrides
        marketing: false,
        version: CONSENT_VERSION,
      });
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("wait for page to fully load", async () => {
      await page.waitForTimeout(2000);
    });

    await logger.step("verify GA4 is NOT loaded despite consent", async () => {
      const gaLoaded = await isGA4Loaded(page);
      expect(gaLoaded).toBe(false);
    });
  });
});

test.describe("Consent Settings - Keyboard Navigation", () => {
  test("dialog is keyboard navigable", async ({ page, logger }) => {
    await logger.step("clear consent and navigate", async () => {
      await page.goto("/");
      await clearConsent(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
    });

    await logger.step("open settings", async () => {
      await waitForBanner(page);
      await openSettingsFromBanner(page);
    });

    await logger.step("verify dialog can be closed with Escape", async () => {
      const { dialog } = getSettingsLocators(page);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    });

    await logger.step("verify banner is still visible after Escape", async () => {
      const { banner } = getBannerLocators(page);
      await expect(banner).toBeVisible();
    });
  });
});
