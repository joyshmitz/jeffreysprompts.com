"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { CookieSettingsPanel } from "@/components/consent/CookieSettingsPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const plausibleSrc =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function CookieConsentManager() {
  const {
    consent,
    preferences,
    privacySignals,
    shouldShowBanner,
    acceptAll,
    rejectAll,
    savePreferences,
  } = useCookieConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState(preferences);

  const analyticsAllowed =
    consent?.analytics === true &&
    !privacySignals.dnt &&
    !privacySignals.gpc;

  useEffect(() => {
    setDraftPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const handleOpen = () => setSettingsOpen(true);
    window.addEventListener("jfp:open-cookie-settings", handleOpen);
    return () => window.removeEventListener("jfp:open-cookie-settings", handleOpen);
  }, []);

  const handleSave = useCallback(() => {
    savePreferences(draftPreferences, "settings");
    setSettingsOpen(false);
  }, [draftPreferences, savePreferences]);

  const handleCustomize = useCallback(() => {
    setDraftPreferences(preferences);
    setSettingsOpen(true);
  }, [preferences]);

  const bannerCopy = useMemo(
    () => (
      <>
        We use essential cookies for core functionality. Analytics and marketing cookies
        are optional.{" "}
        <Link href="/cookies" className="underline underline-offset-4">
          Cookie policy
        </Link>
        .
      </>
    ),
    []
  );

  return (
    <>
      {analyticsAllowed && plausibleDomain && (
        <Script
          data-domain={plausibleDomain}
          data-respect-dnt="true"
          src={plausibleSrc}
          strategy="afterInteractive"
        />
      )}

      {analyticsAllowed && gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: false });
                window.dispatchEvent(new Event('jfp:ga-ready'));
              `,
            }}
          />
        </>
      )}

      {shouldShowBanner && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              <p className="text-foreground font-semibold mb-1">Cookie preferences</p>
              {bannerCopy}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={rejectAll}>
                Reject all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCustomize}>
                Customize
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent size="lg">
          <DialogHeader separated>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Control how we use optional cookies. Essential cookies are always on.
            </DialogDescription>
          </DialogHeader>
          <DialogBody scrollable>
            <CookieSettingsPanel
              preferences={draftPreferences}
              onChange={setDraftPreferences}
              privacySignals={privacySignals}
            />
          </DialogBody>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CookieConsentManager;
