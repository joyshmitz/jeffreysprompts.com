/**
 * Consent Helpers - E2E test utilities for cookie consent functionality
 *
 * Provides utilities for:
 * - Managing localStorage consent state
 * - Simulating privacy signals (DNT/GPC)
 * - Interacting with consent UI elements
 */

import type { Page } from "@playwright/test";

/** Storage key used by the app */
export const CONSENT_STORAGE_KEY = "jfp-cookie-consent";

/** Current consent version - must match the app's version */
export const CONSENT_VERSION = "2026-01-12";

/** Consent object structure */
export interface ConsentState {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  consentedAt: string;
  version: string;
  source: "banner" | "settings";
}

/**
 * Clear consent state from localStorage
 */
export async function clearConsent(page: Page): Promise<void> {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, CONSENT_STORAGE_KEY);
}

/**
 * Set consent state directly in localStorage
 */
export async function setConsent(
  page: Page,
  consent: Partial<ConsentState>
): Promise<void> {
  const fullConsent: ConsentState = {
    essential: true,
    analytics: consent.analytics ?? false,
    marketing: consent.marketing ?? false,
    consentedAt: consent.consentedAt ?? new Date().toISOString(),
    version: consent.version ?? CONSENT_VERSION,
    source: consent.source ?? "banner",
  };

  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: CONSENT_STORAGE_KEY, value: fullConsent }
  );
}

/**
 * Read current consent state from localStorage
 */
export async function getConsent(page: Page): Promise<ConsentState | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ConsentState;
    } catch {
      return null;
    }
  }, CONSENT_STORAGE_KEY);
}

/**
 * Set outdated consent version to trigger re-consent banner
 */
export async function setOutdatedConsent(page: Page): Promise<void> {
  await setConsent(page, {
    analytics: true,
    marketing: false,
    version: "2020-01-01", // Old version forces re-consent
    source: "banner",
  });
}

/**
 * Consent banner locators
 */
export function getBannerLocators(page: Page) {
  return {
    banner: page.locator(".fixed.inset-x-4.bottom-4"),
    acceptAllButton: page.getByRole("button", { name: "Accept all" }),
    rejectAllButton: page.getByRole("button", { name: "Reject all" }),
    customizeButton: page.getByRole("button", { name: "Customize" }),
    cookiePolicyLink: page.getByRole("link", { name: "Cookie policy" }),
  };
}

/**
 * Consent settings dialog locators
 */
export function getSettingsLocators(page: Page) {
  // Use a more specific selector to avoid matching Next.js error overlays
  const dialog = page.locator('[role="dialog"]').filter({
    has: page.getByRole("heading", { name: "Cookie preferences" }),
  });

  return {
    dialog,
    dialogTitle: dialog.getByRole("heading", { name: "Cookie preferences" }),
    essentialSwitch: dialog.getByRole("switch", {
      name: "Essential cookies are always on",
    }),
    analyticsSwitch: dialog.getByRole("switch", {
      name: "Toggle analytics cookies",
    }),
    marketingSwitch: dialog.getByRole("switch", {
      name: "Toggle marketing cookies",
    }),
    saveButton: dialog.getByRole("button", { name: "Save preferences" }),
    cancelButton: dialog.getByRole("button", { name: "Cancel" }),
    privacySignalNotice: dialog.getByText("Your browser privacy signal is enabled"),
  };
}

/**
 * Wait for consent banner to appear
 */
export async function waitForBanner(page: Page, timeout = 5000): Promise<void> {
  const { banner } = getBannerLocators(page);
  await banner.waitFor({ state: "visible", timeout });
}

/**
 * Wait for consent banner to disappear
 */
export async function waitForBannerHidden(
  page: Page,
  timeout = 5000
): Promise<void> {
  const { banner } = getBannerLocators(page);
  await banner.waitFor({ state: "hidden", timeout });
}

/**
 * Wait for consent to be saved in localStorage
 */
export async function waitForConsentSaved(
  page: Page,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (key) => {
      const raw = localStorage.getItem(key);
      return raw !== null;
    },
    CONSENT_STORAGE_KEY,
    { timeout }
  );
}

/**
 * Click Accept All and wait for banner to close and consent to be saved
 */
export async function acceptAllCookies(page: Page): Promise<void> {
  const { acceptAllButton } = getBannerLocators(page);
  await acceptAllButton.click();
  await waitForConsentSaved(page);
  await waitForBannerHidden(page);
}

/**
 * Click Reject All and wait for banner to close and consent to be saved
 */
export async function rejectAllCookies(page: Page): Promise<void> {
  const { rejectAllButton } = getBannerLocators(page);
  await rejectAllButton.click();
  await waitForConsentSaved(page);
  await waitForBannerHidden(page);
}

/**
 * Open settings dialog from banner
 */
export async function openSettingsFromBanner(page: Page): Promise<void> {
  const { customizeButton } = getBannerLocators(page);
  await customizeButton.click();
  const { dialog } = getSettingsLocators(page);
  await dialog.waitFor({ state: "visible" });
}

/**
 * Open cookie settings via custom event (simulates footer link click)
 */
export async function openSettingsViaEvent(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("jfp:open-cookie-settings"));
  });
  const { dialog } = getSettingsLocators(page);
  await dialog.waitFor({ state: "visible" });
}

/**
 * Check if GA4 script is loaded
 */
export async function isGA4Loaded(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return typeof window.gtag === "function";
  });
}

/**
 * Wait for GA ready event
 */
export async function waitForGAReady(
  page: Page,
  timeout = 5000
): Promise<boolean> {
  return page.evaluate((ms) => {
    return new Promise<boolean>((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), ms);
      if (typeof window.gtag === "function") {
        clearTimeout(timeoutId);
        resolve(true);
        return;
      }
      const handler = () => {
        clearTimeout(timeoutId);
        resolve(true);
      };
      window.addEventListener("jfp:ga-ready", handler, { once: true });
    });
  }, timeout);
}

/**
 * Check if Plausible script is loaded
 */
export async function isPlausibleLoaded(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const scripts = document.querySelectorAll('script[src*="plausible"]');
    return scripts.length > 0;
  });
}

/**
 * Setup page with DNT (Do Not Track) signal
 */
export async function setupWithDNT(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", {
      value: "1",
      configurable: true,
    });
  });
}

/**
 * Setup page with GPC (Global Privacy Control) signal
 */
export async function setupWithGPC(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      value: true,
      configurable: true,
    });
  });
}

/**
 * Setup page with both DNT and GPC signals
 */
export async function setupWithAllPrivacySignals(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", {
      value: "1",
      configurable: true,
    });
    Object.defineProperty(navigator, "globalPrivacyControl", {
      value: true,
      configurable: true,
    });
  });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
