/**
 * Tests for GET /api/admin/appeals
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const TOKEN = "test-admin-token";

function authedRequest(params = ""): NextRequest {
  const url = `http://localhost/api/admin/appeals${params ? `?${params}` : ""}`;
  return new NextRequest(url, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
}

function clearStores() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_appeal_store__"];
  delete g["__jfp_action_store__"];
}

describe("/api/admin/appeals", () => {
  const envBackup: Record<string, string | undefined> = {};

  beforeEach(() => {
    envBackup.JFP_ADMIN_TOKEN = process.env.JFP_ADMIN_TOKEN;
    envBackup.JFP_ADMIN_ROLE = process.env.JFP_ADMIN_ROLE;
    process.env.JFP_ADMIN_TOKEN = TOKEN;
    process.env.JFP_ADMIN_ROLE = "super_admin";
    clearStores();
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(envBackup)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("returns 401 without token", async () => {
    const res = await GET(new NextRequest("http://localhost/api/admin/appeals"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for insufficient role", async () => {
    process.env.JFP_ADMIN_ROLE = "support";
    const res = await GET(authedRequest());
    expect(res.status).toBe(403);
  });

  it("returns appeals with pagination and stats", async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.appeals)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.stats).toBeDefined();
    expect(typeof data.stats.total).toBe("number");
    expect(typeof data.stats.pending).toBe("number");
  });

  it("accepts status=all filter", async () => {
    const res = await GET(authedRequest("status=all"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.pagination).toBeDefined();
  });

  it("clamps limit to max 50", async () => {
    const res = await GET(authedRequest("limit=100"));
    const data = await res.json();
    expect(data.pagination.limit).toBe(50);
  });

  it("clamps page to min 1", async () => {
    const res = await GET(authedRequest("page=0"));
    const data = await res.json();
    expect(data.pagination.page).toBe(1);
  });
});
