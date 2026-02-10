/**
 * Tests for GET /api/admin/users
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const TOKEN = "test-admin-token";

function authedRequest(params = ""): NextRequest {
  const url = `http://localhost/api/admin/users${params ? `?${params}` : ""}`;
  return new NextRequest(url, {
    headers: { authorization: `Bearer ${TOKEN}` },
  });
}

describe("/api/admin/users", () => {
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
    const res = await GET(new NextRequest("http://localhost/api/admin/users"));
    expect(res.status).toBe(401);
  });

  it("returns users with pagination", async () => {
    const res = await GET(authedRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBeGreaterThan(0);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(20);
  });

  it("filters by search term", async () => {
    const res = await GET(authedRequest("search=alice"));
    const data = await res.json();
    expect(data.users.length).toBe(1);
    expect(data.users[0].name).toBe("Alice Johnson");
  });

  it("filters by tier", async () => {
    const res = await GET(authedRequest("tier=premium"));
    const data = await res.json();
    for (const user of data.users) {
      expect(user.tier).toBe("premium");
    }
  });

  it("filters by status", async () => {
    const res = await GET(authedRequest("status=suspended"));
    const data = await res.json();
    expect(data.users.length).toBe(1);
    expect(data.users[0].status).toBe("suspended");
  });

  it("clamps limit to max 100", async () => {
    const res = await GET(authedRequest("limit=200"));
    const data = await res.json();
    expect(data.pagination.limit).toBe(100);
  });

  it("clamps page to min 1", async () => {
    const res = await GET(authedRequest("page=-5"));
    const data = await res.json();
    expect(data.pagination.page).toBe(1);
  });

  it("returns filter metadata", async () => {
    const res = await GET(authedRequest("search=test&tier=free&status=active"));
    const data = await res.json();
    expect(data.filters.search).toBe("test");
    expect(data.filters.tier).toBe("free");
    expect(data.filters.status).toBe("active");
  });
});
