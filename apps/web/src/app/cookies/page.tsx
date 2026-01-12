"use client";

import { useEffect, useState } from "react";
import { CookieSettingsPanel } from "@/components/consent/CookieSettingsPanel";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import type { CookiePreferences } from "@/lib/consent/cookie-consent";

export default function CookiesPage() {
  const { consent, preferences, privacySignals, savePreferences } = useCookieConsent();
  const [draft, setDraft] = useState<CookiePreferences>(preferences);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-foreground">Cookie settings</h1>
          <p className="text-muted-foreground">
            Manage optional cookies for analytics and marketing. Essential cookies are always on.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <CookieSettingsPanel
            preferences={draft}
            onChange={setDraft}
            privacySignals={privacySignals}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {consent?.consentedAt
                ? `Last updated: ${new Date(consent.consentedAt).toLocaleString()}`
                : "No consent saved yet."}
            </div>
            <Button onClick={() => savePreferences(draft, "settings")}>
              Save preferences
            </Button>
          </div>
        </div>

        <div className="mt-12 space-y-4 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">Cookie policy</h2>
          <p>
            We use essential cookies to keep the site secure and remember core preferences.
            Analytics cookies are used only when you opt in to help us improve the product.
          </p>
          <p>
            You can update these preferences at any time from this page or the footer link.
          </p>
        </div>
      </div>
    </div>
  );
}
