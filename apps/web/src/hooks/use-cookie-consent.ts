"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  type CookieConsent,
  type CookiePreferences,
  type PrivacySignals,
  buildConsent,
  getDefaultPreferences,
  getPrivacySignals,
} from "@/lib/consent/cookie-consent";

export interface UseCookieConsentReturn {
  consent: CookieConsent | null;
  preferences: CookiePreferences;
  privacySignals: PrivacySignals;
  shouldShowBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (preferences: CookiePreferences, source?: CookieConsent["source"]) => void;
  resetConsent: () => void;
}

export function useCookieConsent(): UseCookieConsentReturn {
  const [storedConsent, setStoredConsent, clearConsent] = useLocalStorage<CookieConsent | null>(
    COOKIE_CONSENT_STORAGE_KEY,
    null
  );

  const privacySignals = useMemo(() => getPrivacySignals(), []);
  const defaultPreferences = useMemo(
    () => getDefaultPreferences(privacySignals),
    [privacySignals]
  );

  const isConsentCurrent = storedConsent?.version === COOKIE_CONSENT_VERSION;
  const consent = isConsentCurrent ? storedConsent : null;
  const storedPreferences: CookiePreferences = storedConsent
    ? { analytics: storedConsent.analytics, marketing: storedConsent.marketing }
    : defaultPreferences;
  const preferences: CookiePreferences =
    privacySignals.dnt || privacySignals.gpc
      ? { analytics: false, marketing: false }
      : storedPreferences;

  const shouldShowBanner = !isConsentCurrent;

  const savePreferences = useCallback(
    (next: CookiePreferences, source: CookieConsent["source"] = "settings") => {
      setStoredConsent(buildConsent(next, source));
    },
    [setStoredConsent]
  );

  const acceptAll = useCallback(
    () => savePreferences({ analytics: true, marketing: true }, "banner"),
    [savePreferences]
  );

  const rejectAll = useCallback(
    () => savePreferences({ analytics: false, marketing: false }, "banner"),
    [savePreferences]
  );

  return {
    consent,
    preferences,
    privacySignals,
    shouldShowBanner,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent: clearConsent,
  };
}
