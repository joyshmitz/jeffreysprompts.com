/**
 * Unit tests for /api/health/ready route (GET)
 * @module api/health/ready/route.test
 */

import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/health/checks", () => ({
  runReadyChecks: vi.fn().mockResolvedValue({
    status: "ready",
    checks: { registry: true },
  }),
}));

describe("/api/health/ready GET", () => {
  it("returns 200 when all checks pass", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ready");
    expect(data.checks.registry).toBe(true);
  });

  it("includes timestamp", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.timestamp).toBeTruthy();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("sets no-store cache header", async () => {
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 503 when degraded", async () => {
    const { runReadyChecks } = await import("@/lib/health/checks");
    vi.mocked(runReadyChecks).mockResolvedValueOnce({
      status: "degraded",
      checks: { registry: false },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.status).toBe("degraded");
  });
});
