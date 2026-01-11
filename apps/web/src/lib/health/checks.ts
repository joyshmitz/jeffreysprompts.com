import { prompts } from "@jeffreysprompts/core/prompts";

export type HealthStatus = "ready" | "degraded";

export interface HealthCheckDefinition {
  name: string;
  check: () => Promise<boolean>;
  critical?: boolean;
}

export interface HealthCheckOutcome {
  ok: boolean;
  durationMs: number;
}

function nowMs(): number {
  return Date.now();
}

async function runCheck(def: HealthCheckDefinition): Promise<HealthCheckOutcome> {
  const start = nowMs();
  try {
    const ok = await def.check();
    return { ok, durationMs: nowMs() - start };
  } catch {
    return { ok: false, durationMs: nowMs() - start };
  }
}

function normalizeUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed ? trimmed : null;
}

async function checkUrl(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function getReadyChecks(): HealthCheckDefinition[] {
  const checks: HealthCheckDefinition[] = [
    {
      name: "registry",
      check: async () => prompts.length > 0,
      critical: true,
    },
  ];

  const readyUrl = normalizeUrl(process.env.JFP_READY_CHECK_URL);
  if (readyUrl) {
    const timeoutMs = Number(process.env.JFP_READY_CHECK_TIMEOUT_MS ?? 1500);
    checks.push({
      name: "remote",
      check: () => checkUrl(readyUrl, Number.isFinite(timeoutMs) ? timeoutMs : 1500),
      critical: true,
    });
  }

  return checks;
}

export async function runReadyChecks(): Promise<{
  status: HealthStatus;
  checks: Record<string, boolean>;
}> {
  const defs = getReadyChecks();
  const outcomes = await Promise.all(defs.map((def) => runCheck(def)));

  const checks: Record<string, boolean> = {};
  for (let i = 0; i < defs.length; i += 1) {
    checks[defs[i].name] = outcomes[i].ok;
  }

  const status: HealthStatus = Object.values(checks).every(Boolean) ? "ready" : "degraded";

  return { status, checks };
}

export async function runStatusChecks(): Promise<{
  status: HealthStatus;
  checks: Record<string, HealthCheckOutcome>;
}> {
  const defs = getReadyChecks();
  const outcomes = await Promise.all(defs.map((def) => runCheck(def)));

  const checks: Record<string, HealthCheckOutcome> = {};
  for (let i = 0; i < defs.length; i += 1) {
    checks[defs[i].name] = outcomes[i];
  }

  const status: HealthStatus = Object.values(checks).every((entry) => entry.ok)
    ? "ready"
    : "degraded";

  return { status, checks };
}
