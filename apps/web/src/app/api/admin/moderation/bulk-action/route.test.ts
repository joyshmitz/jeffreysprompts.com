/**
 * Tests for POST /api/admin/moderation/bulk-action
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const TOKEN = "test-admin-token";

function authedRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/moderation/bulk-action", {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_report_store__"];
}

describe("POST /api/admin/moderation/bulk-action", () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.JFP_ADMIN_TOKEN = process.env.JFP_ADMIN_TOKEN;
    envBackup.JFP_ADMIN_ROLE = process.env.JFP_ADMIN_ROLE;
    process.env.JFP_ADMIN_TOKEN = TOKEN;
    process.env.JFP_ADMIN_ROLE = "super_admin";
    clearStore();
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns 401 without token", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/moderation/bulk-action", {
        method: "POST",
        body: JSON.stringify({ itemIds: ["a"], action: "dismiss" }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty itemIds", async () => {
    const res = await POST(authedRequest({ itemIds: [], action: "dismiss" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing itemIds", async () => {
    const res = await POST(authedRequest({ action: "dismiss" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-string itemIds", async () => {
    const res = await POST(authedRequest({ itemIds: [123, ""], action: "dismiss" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing action", async () => {
    const res = await POST(authedRequest({ itemIds: ["r1"] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid action", async () => {
    const res = await POST(authedRequest({ itemIds: ["r1"], action: "nuke" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for batch size exceeding 100", async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `r-${i}`);
    const res = await POST(authedRequest({ itemIds: ids, action: "dismiss" }));
    expect(res.status).toBe(400);
  });

  it("processes bulk action and returns summary", async () => {
    const res = await POST(
      authedRequest({ itemIds: ["nonexistent-1", "nonexistent-2"], action: "dismiss" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.results).toBeDefined();
    expect(data.results.length).toBe(2);
    expect(data.summary).toBeDefined();
    expect(data.summary.total).toBe(2);
    // Both should fail since reports don't exist
    expect(data.summary.failed).toBe(2);
    expect(data.summary.succeeded).toBe(0);
  });

  it("handles invalid JSON body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/moderation/bulk-action", {
        method: "POST",
        body: "not json",
        headers: {
          authorization: `Bearer ${TOKEN}`,
          "content-type": "application/json",
        },
      })
    );
    expect(res.status).toBe(400);
  });
});
