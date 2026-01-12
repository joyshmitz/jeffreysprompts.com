"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { CookiePreferences, PrivacySignals } from "@/lib/consent/cookie-consent";
import { cn } from "@/lib/utils";

interface CookieSettingsPanelProps {
  preferences: CookiePreferences;
  onChange: (preferences: CookiePreferences) => void;
  privacySignals: PrivacySignals;
  className?: string;
}

export function CookieSettingsPanel({
  preferences,
  onChange,
  privacySignals,
  className,
}: CookieSettingsPanelProps) {
  const controlsDisabled = privacySignals.dnt || privacySignals.gpc;

  return (
    <div className={cn("space-y-4", className)}>
      {controlsDisabled && (
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          Your browser privacy signal is enabled. Analytics and marketing cookies stay off while it
          remains enabled.
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label size="sm">Essential cookies</Label>
            <p className="text-xs text-muted-foreground">
              Required for security, core functionality, and preference storage.
            </p>
          </div>
          <Switch checked disabled aria-label="Essential cookies are always on" />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label size="sm">Analytics cookies</Label>
            <p className="text-xs text-muted-foreground">
              Help us understand usage patterns and improve the product.
            </p>
          </div>
          <Switch
            checked={preferences.analytics}
            disabled={controlsDisabled}
            onCheckedChange={(checked) =>
              onChange({ ...preferences, analytics: checked })
            }
            aria-label="Toggle analytics cookies"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label size="sm">Marketing cookies</Label>
            <p className="text-xs text-muted-foreground">
              Used for retargeting and social media integrations. Currently unused.
            </p>
          </div>
          <Switch
            checked={preferences.marketing}
            disabled={controlsDisabled}
            onCheckedChange={(checked) =>
              onChange({ ...preferences, marketing: checked })
            }
            aria-label="Toggle marketing cookies"
          />
        </div>
      </div>
    </div>
  );
}

export default CookieSettingsPanel;
