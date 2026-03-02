/**
 * Tests for POST /api/moderation/report
 * This route re-exports POST from /api/reports. Verify the binding works.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function clearStores() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_report_store__"];
  delete g["__jfp_rate_limiter_reports__"];
}

function makeReport(body: unknown, ip = "10.0.0.1"): NextRequest {
  return new NextRequest("http://localhost/api/moderation/report", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

describe("POST /api/moderation/report", () => {
  beforeEach(() => {
    clearStores();
  });

  it("is the same handler as /api/reports POST", async () => {
    const { POST: reportsPost } = await import("@/app/api/reports/route");
    expect(POST).toBe(reportsPost);
  });

  it("creates a report via the moderation alias", async () => {
    const res = await POST(
      makeReport({
        contentType: "prompt",
        contentId: "mod-test-1",
        reason: "spam",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBeDefined();
  });

  it("returns 400 for missing fields via the alias", async () => {
    const res = await POST(makeReport({}));
    expect(res.status).toBe(400);
  });
});
