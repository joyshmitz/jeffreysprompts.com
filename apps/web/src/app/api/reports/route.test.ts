/**
 * Tests for POST /api/reports (public content reporting)
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
  return new NextRequest("http://localhost/api/reports", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
  });
}

describe("POST /api/reports", () => {
  beforeEach(() => {
    clearStores();
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeReport({ contentType: "prompt" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid content type", async () => {
    const res = await POST(
      makeReport({ contentType: "invalid", contentId: "p1", reason: "spam" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid reason", async () => {
    const res = await POST(
      makeReport({ contentType: "prompt", contentId: "p1", reason: "invalid_reason" })
    );
    expect(res.status).toBe(400);
  });

  it("creates report with valid payload", async () => {
    const res = await POST(
      makeReport({
        contentType: "prompt",
        contentId: "test-prompt-1",
        reason: "spam",
        details: "This is spam content",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBeDefined();
    expect(data.content.type).toBe("prompt");
  });

  it("returns 400 for details exceeding 500 chars", async () => {
    const res = await POST(
      makeReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "offensive",
        details: "x".repeat(501),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for title exceeding 140 chars", async () => {
    const res = await POST(
      makeReport({
        contentType: "prompt",
        contentId: "p1",
        reason: "spam",
        contentTitle: "x".repeat(141),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate report from same IP", async () => {
    const body = {
      contentType: "prompt",
      contentId: "dup-test",
      reason: "spam",
    };

    const first = await POST(makeReport(body, "10.0.0.50"));
    expect(first.status).toBe(200);

    const second = await POST(makeReport(body, "10.0.0.50"));
    expect(second.status).toBe(409);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/reports", {
        method: "POST",
        body: "not json",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "10.0.0.1",
        },
      })
    );
    expect(res.status).toBe(400);
  });
});
