"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, DollarSign, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

const STORAGE_KEY = "jfp_budget_settings_v1";

type BudgetSettings = {
  monthlyCapUsd: number | null;
  perRunCapUsd: number | null;
  alertsEnabled: boolean;
  hardStopEnabled: boolean;
  updatedAt: string | null;
};

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyCapUsd: null,
  perRunCapUsd: null,
  alertsEnabled: true,
  hardStopEnabled: false,
  updatedAt: null,
};

function parseCurrency(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return NaN;
  return parsed;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "";
  return String(value);
}

function loadSettings(): BudgetSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BudgetSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: BudgetSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function clearSettings(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export default function BudgetSettingsPage() {
  const { success, error } = useToast();
  const [monthlyCapInput, setMonthlyCapInput] = useState("");
  const [perRunCapInput, setPerRunCapInput] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [hardStopEnabled, setHardStopEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    setMonthlyCapInput(formatCurrency(settings.monthlyCapUsd));
    setPerRunCapInput(formatCurrency(settings.perRunCapUsd));
    setAlertsEnabled(settings.alertsEnabled);
    setHardStopEnabled(settings.hardStopEnabled);
    setLastUpdated(settings.updatedAt);
    setLoaded(true);
  }, []);

  const monthlyCapValue = useMemo(
    () => parseCurrency(monthlyCapInput),
    [monthlyCapInput]
  );
  const perRunCapValue = useMemo(
    () => parseCurrency(perRunCapInput),
    [perRunCapInput]
  );

  const monthlyCapError =
    loaded && Number.isNaN(monthlyCapValue)
      ? "Enter a non-negative number."
      : undefined;
  const perRunCapError =
    loaded && Number.isNaN(perRunCapValue)
      ? "Enter a non-negative number."
      : undefined;

  const capMismatch =
    monthlyCapValue !== null &&
    perRunCapValue !== null &&
    !Number.isNaN(monthlyCapValue) &&
    !Number.isNaN(perRunCapValue) &&
    perRunCapValue > monthlyCapValue;

  const canSave = loaded && !monthlyCapError && !perRunCapError;

  const handleSave = () => {
    if (!canSave) {
      error("Fix the highlighted fields before saving.");
      return;
    }

    const next: BudgetSettings = {
      monthlyCapUsd: monthlyCapValue ?? null,
      perRunCapUsd: perRunCapValue ?? null,
      alertsEnabled,
      hardStopEnabled,
      updatedAt: new Date().toISOString(),
    };

    saveSettings(next);
    setLastUpdated(next.updatedAt);
    success("Budget settings saved", "Stored locally on this device.");
  };

  const handleReset = () => {
    clearSettings();
    setMonthlyCapInput("");
    setPerRunCapInput("");
    setAlertsEnabled(DEFAULT_SETTINGS.alertsEnabled);
    setHardStopEnabled(DEFAULT_SETTINGS.hardStopEnabled);
    setLastUpdated(null);
    success("Budget settings cleared", "Local overrides removed.");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="border-b border-border/60 bg-white dark:bg-neutral-900">
        <div className="container-wide py-10">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to settings
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-900 dark:text-white">
              Budget & Alerts
            </h1>
            <Badge variant="secondary">Pro</Badge>
          </div>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Set monthly caps and per-run warnings to keep prompt spending predictable.
          </p>
        </div>
      </div>

      <div className="container-wide py-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-sky-500" />
              Local-only preview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            These settings are stored locally in your browser until the Pro backend is ready.
            You can already use them alongside <span className="font-mono">jfp cost</span> to
            estimate usage.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Budget limits
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              label="Monthly budget cap (USD)"
              placeholder="e.g. 25"
              value={monthlyCapInput}
              onChange={(event) => setMonthlyCapInput(event.target.value)}
              error={monthlyCapError}
              hint="Leave blank for no monthly cap."
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              label="Per-run warning threshold (USD)"
              placeholder="e.g. 2.50"
              value={perRunCapInput}
              onChange={(event) => setPerRunCapInput(event.target.value)}
              error={perRunCapError}
              hint="Warn when a prompt run exceeds this amount."
            />
            {capMismatch && (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                Per-run threshold is higher than your monthly cap.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Enable budget alerts</p>
                <p className="text-sm text-muted-foreground">
                  Show warnings when estimates cross your thresholds.
                </p>
              </div>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Hard stop on overage</p>
                <p className="text-sm text-muted-foreground">
                  Block runs when you hit the monthly cap (backend required).
                </p>
              </div>
              <Switch checked={hardStopEnabled} onCheckedChange={setHardStopEnabled} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save settings
          </Button>
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last saved: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
