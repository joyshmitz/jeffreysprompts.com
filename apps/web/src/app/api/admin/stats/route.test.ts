/**
 * Tests for GET /api/admin/stats
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const TOKEN = "test-admin-token";

function authedRequest(url = "http://localhost/api/admin/stats"): NextRequest {
  return new NextRequest(url, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
}

describe("/api/admin/stats", () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.JFP_ADMIN_TOKEN = process.env.JFP_ADMIN_TOKEN;
    envBackup.JFP_ADMIN_ROLE = process.env.JFP_ADMIN_ROLE;
    process.env.JFP_ADMIN_TOKEN = TOKEN;
    process.env.JFP_ADMIN_ROLE = "super_admin";
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns 401 without token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/admin/stats"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for insufficient role", async () => {
    process.env.JFP_ADMIN_ROLE = "support";
    const res = await GET(authedRequest());
    expect(res.status).toBe(403);
  });

  it("returns mock stats with expected fields", async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalUsers).toBe(1234);
    expect(data.mrr).toBe(3420);
    expect(data.pendingModeration).toBe(12);
    expect(data.generatedAt).toBeDefined();
  });

  it("sets no-store cache header", async () => {
    const res = await GET(authedRequest());
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
