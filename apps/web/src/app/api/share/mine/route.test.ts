/**
 * Tests for GET /api/share/mine
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { createShareLink } from "@/lib/share-links/share-link-store";
import { USER_ID_COOKIE_NAME, createUserIdCookieValue } from "@/lib/user-id";

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_share_link_store__"];
}

function makeRequest(params = ""): NextRequest {
  const url = `http://localhost/api/share/mine${params ? `?${params}` : ""}`;
  return new NextRequest(url);
}

const TEST_SHARE_PASSWORD = ["share", "test", "password"].join("-");

describe("GET /api/share/mine", () => {
  beforeEach(() => {
    clearStore();
  });

  it("returns links array for anonymous user", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.links)).toBe(true);
  });

  it("returns empty links for new user", async () => {
    const res = await GET(makeRequest());
    const data = await res.json();
    expect(data.links).toHaveLength(0);
  });

  it("accepts includeInactive param", async () => {
    const res = await GET(makeRequest("includeInactive=true"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.links)).toBe(true);
  });

  it("sets private cache headers", async () => {
    const res = await GET(makeRequest());
    expect(res.headers.get("cache-control")).toContain("private");
  });

  it("exposes password protection state for the current user", async () => {
    const userId = "user-1";
    createShareLink({
      userId,
      contentType: "prompt",
      contentId: "idea-wizard",
      password: TEST_SHARE_PASSWORD,
    });

    const request = new NextRequest("http://localhost/api/share/mine");
    request.cookies.set(
      USER_ID_COOKIE_NAME,
      createUserIdCookieValue(userId)
    );

    const res = await GET(request);
    const data = await res.json();

    expect(data.links).toHaveLength(1);
    expect(data.links[0].isPasswordProtected).toBe(true);
  });
});
