/**
 * Unit tests for cookie-consent
 * @module lib/consent/cookie-consent.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getPrivacySignals,
  getDefaultPreferences,
  buildConsent,
  readStoredConsent,
  hasAnalyticsConsent,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
} from "./cookie-consent";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cookie-consent", () => {
  beforeEach(() => {
    // Reset localStorage
    window.localStorage.clear();

    // Reset navigator properties
    Object.defineProperty(navigator, "doNotTrack", {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  // -----------------------------------------------------------------------
  // Constants
  // -----------------------------------------------------------------------

  describe("constants", () => {
    it("exports expected constants", () => {
      expect(COOKIE_CONSENT_STORAGE_KEY).toBe("jfp-cookie-consent");
      expect(COOKIE_CONSENT_VERSION).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // getPrivacySignals
  // -----------------------------------------------------------------------

  describe("getPrivacySignals", () => {
    it("returns signals object", () => {
      const signals = getPrivacySignals();
      expect(signals).toHaveProperty("dnt");
      expect(signals).toHaveProperty("gpc");
    });

    it("detects DNT when set to 1", () => {
      Object.defineProperty(navigator, "doNotTrack", {
        value: "1",
        writable: true,
        configurable: true,
      });

      const signals = getPrivacySignals();
      expect(signals.dnt).toBe(true);
    });

    it("returns false for DNT when not set", () => {
      Object.defineProperty(navigator, "doNotTrack", {
        value: null,
        writable: true,
        configurable: true,
      });

      const signals = getPrivacySignals();
      expect(signals.dnt).toBe(false);
    });

    it("detects GPC when set", () => {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        value: true,
        writable: true,
        configurable: true,
      });

      const signals = getPrivacySignals();
      expect(signals.gpc).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getDefaultPreferences
  // -----------------------------------------------------------------------

  describe("getDefaultPreferences", () => {
    it("returns analytics/marketing false when DNT is set", () => {
      const prefs = getDefaultPreferences({ dnt: true, gpc: false });
      expect(prefs.analytics).toBe(false);
      expect(prefs.marketing).toBe(false);
    });

    it("returns analytics/marketing false when GPC is set", () => {
      const prefs = getDefaultPreferences({ dnt: false, gpc: true });
      expect(prefs.analytics).toBe(false);
      expect(prefs.marketing).toBe(false);
    });

    it("returns defaults when no privacy signals", () => {
      const prefs = getDefaultPreferences({ dnt: false, gpc: false });
      expect(prefs.analytics).toBe(false);
      expect(prefs.marketing).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // buildConsent
  // -----------------------------------------------------------------------

  describe("buildConsent", () => {
    it("builds consent object from preferences", () => {
      const consent = buildConsent(
        { analytics: true, marketing: false },
        "banner"
      );

      expect(consent.essential).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(false);
      expect(consent.source).toBe("banner");
      expect(consent.version).toBe(COOKIE_CONSENT_VERSION);
      expect(consent.consentedAt).toBeTruthy();
    });

    it("supports settings source", () => {
      const consent = buildConsent(
        { analytics: false, marketing: false },
        "settings"
      );
      expect(consent.source).toBe("settings");
    });

    it("coerces preferences to boolean", () => {
      const consent = buildConsent(
        { analytics: true, marketing: true },
        "banner"
      );
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // readStoredConsent
  // -----------------------------------------------------------------------

  describe("readStoredConsent", () => {
    it("returns null when no consent stored", () => {
      expect(readStoredConsent()).toBeNull();
    });

    it("returns consent when stored", () => {
      const consent = buildConsent({ analytics: true, marketing: false }, "banner");
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));

      const stored = readStoredConsent();
      expect(stored?.analytics).toBe(true);
      expect(stored?.marketing).toBe(false);
    });

    it("returns null for outdated version", () => {
      const old = {
        essential: true,
        analytics: true,
        marketing: false,
        consentedAt: new Date().toISOString(),
        version: "old-version",
        source: "banner",
      };
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(old));

      expect(readStoredConsent()).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "not-json");
      expect(readStoredConsent()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // hasAnalyticsConsent
  // -----------------------------------------------------------------------

  describe("hasAnalyticsConsent", () => {
    it("returns false when no consent stored", () => {
      expect(hasAnalyticsConsent()).toBe(false);
    });

    it("returns true when analytics consent granted", () => {
      const consent = buildConsent({ analytics: true, marketing: false }, "banner");
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));

      expect(hasAnalyticsConsent()).toBe(true);
    });

    it("returns false when analytics consent denied", () => {
      const consent = buildConsent({ analytics: false, marketing: false }, "settings");
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));

      expect(hasAnalyticsConsent()).toBe(false);
    });
  });
});
