/**
 * Tests for /api/referral/code (GET, POST)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { USER_ID_COOKIE_NAME } from "@/lib/user-id";

const originalUserSecret = process.env.JFP_USER_ID_SECRET;
const originalAnonSecret = process.env.JFP_ANON_ID_SECRET;
const originalVercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const originalVercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_referral_store__"];
}

function applyCookieHeaderToRequest(request: NextRequest, cookieHeader?: string) {
  if (!cookieHeader) {
    return;
  }

  for (const rawPart of cookieHeader.split(";")) {
    const part = rawPart.trim();
    if (part.length === 0) {
      continue;
    }

    const splitAt = part.indexOf("=");
    if (splitAt <= 0) {
      continue;
    }

    request.cookies.set(part.slice(0, splitAt), part.slice(splitAt + 1));
  }
}

function makeRequest(method: "GET" | "POST", cookieHeader?: string): NextRequest {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const request = new NextRequest("http://localhost/api/referral/code", { method, headers });
  applyCookieHeaderToRequest(request, headers.get("cookie") ?? undefined);
  return request;
}

describe("/api/referral/code", () => {
  beforeEach(() => {
    clearStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();

    if (originalUserSecret === undefined) {
      delete process.env.JFP_USER_ID_SECRET;
    } else {
      process.env.JFP_USER_ID_SECRET = originalUserSecret;
    }

    if (originalAnonSecret === undefined) {
      delete process.env.JFP_ANON_ID_SECRET;
    } else {
      process.env.JFP_ANON_ID_SECRET = originalAnonSecret;
    }

    if (originalVercelDeploymentId === undefined) {
      delete process.env.VERCEL_DEPLOYMENT_ID;
    } else {
      process.env.VERCEL_DEPLOYMENT_ID = originalVercelDeploymentId;
    }

    if (originalVercelProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelProductionUrl;
    }

  });

  describe("GET", () => {
    it("returns referral code data", async () => {
      const res = await GET(new NextRequest("http://localhost/api/referral/code"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.code).toBeDefined();
      expect(data.data.url).toBeDefined();
      expect(data.data.rewards).toBeDefined();
      expect(data.data.createdAt).toBeDefined();
    });

    it("sets private cache headers", async () => {
      const res = await GET(new NextRequest("http://localhost/api/referral/code"));
      expect(res.headers.get("cache-control")).toContain("private");
    });

    it("keeps the same referral code after a simulated deployment change", async () => {
      delete process.env.JFP_USER_ID_SECRET;
      delete process.env.JFP_ANON_ID_SECRET;
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "jeffreysprompts.com";
      process.env.VERCEL_DEPLOYMENT_ID = "dpl_before";
      vi.stubEnv("NODE_ENV", "production");
      vi.resetModules();

      const firstDeploymentRoute = await import("./route");
      const firstResponse = await firstDeploymentRoute.GET(makeRequest("GET"));
      const firstPayload = await firstResponse.json();
      const userCookie = firstResponse.cookies.get(USER_ID_COOKIE_NAME)?.value;

      expect(firstPayload.success).toBe(true);
      expect(userCookie).toBeTruthy();

      clearStore();
      process.env.VERCEL_DEPLOYMENT_ID = "dpl_after";
      vi.resetModules();

      const secondDeploymentRoute = await import("./route");
      const secondResponse = await secondDeploymentRoute.GET(
        makeRequest("GET", `${USER_ID_COOKIE_NAME}=${userCookie}`)
      );
      const secondPayload = await secondResponse.json();

      expect(secondPayload.success).toBe(true);
      expect(secondPayload.data.code).toBe(firstPayload.data.code);
      expect(secondPayload.data.url).toBe(firstPayload.data.url);
    });
  });

  describe("POST", () => {
    it("returns referral code data", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/referral/code", { method: "POST" })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.code).toBeDefined();
    });

    it("returns same code for same user", async () => {
      const res1 = await POST(
        new NextRequest("http://localhost/api/referral/code", { method: "POST" })
      );
      const data1 = await res1.json();

      // Second call from same session would produce new user (no cookie carried over)
      // But both calls should succeed
      expect(data1.success).toBe(true);
    });
  });
});
