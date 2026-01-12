"use client";

export const COOKIE_CONSENT_STORAGE_KEY = "jfp-cookie-consent";
export const COOKIE_CONSENT_VERSION = "2026-01-12";

export interface PrivacySignals {
  dnt: boolean;
  gpc: boolean;
}

export interface CookiePreferences {
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsent extends CookiePreferences {
  essential: true;
  consentedAt: string;
  version: string;
  source: "banner" | "settings";
}

export function getPrivacySignals(): PrivacySignals {
  if (typeof navigator === "undefined") {
    return { dnt: false, gpc: false };
  }

  const nav = navigator as Navigator & {
    msDoNotTrack?: string;
    globalPrivacyControl?: boolean;
  };

  const dnt =
    nav.doNotTrack ||
    nav.msDoNotTrack ||
    (window as Window & { doNotTrack?: string }).doNotTrack;

  return {
    dnt: dnt === "1" || dnt === "yes" || dnt === "true",
    gpc: nav.globalPrivacyControl === true,
  };
}

export function getDefaultPreferences(signals: PrivacySignals): CookiePreferences {
  if (signals.dnt || signals.gpc) {
    return { analytics: false, marketing: false };
  }
  return { analytics: false, marketing: false };
}

export function buildConsent(
  preferences: CookiePreferences,
  source: CookieConsent["source"]
): CookieConsent {
  return {
    essential: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    consentedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
    source,
  };
}

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (!parsed || parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = readStoredConsent();
  return Boolean(consent?.analytics);
}
