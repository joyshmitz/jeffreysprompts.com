/**
 * Unit tests for /api/history route (GET, POST, DELETE)
 * @module api/history/route.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "./route";
import { USER_ID_COOKIE_NAME, createUserIdCookieValue } from "@/lib/user-id";

type NextRequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_view_history_store__"];
}

function getHeaderValue(
  headers: NextRequestInit["headers"],
  name: string
): string | null {
  if (!headers) return null;
  if (headers instanceof Headers) return headers.get(name);
  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());
    return found ? found[1] : null;
  }
  return (headers as Record<string, string>)[name] ?? null;
}

function makeRequest(url: string, init?: NextRequestInit): NextRequest {
  const request = new NextRequest(url, init);
  const cookieHeader = getHeaderValue(init?.headers, "cookie");
  if (cookieHeader) {
    for (const part of cookieHeader.split(";").map((s) => s.trim())) {
      if (!part) continue;
      const i = part.indexOf("=");
      if (i <= 0) continue;
      request.cookies.set(part.slice(0, i), part.slice(i + 1));
    }
  }
  return request;
}

const userCookie = `${USER_ID_COOKIE_NAME}=${createUserIdCookieValue("hist-user")}`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("/api/history", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // POST
  // -----------------------------------------------------------------------

  describe("POST", () => {
    it("records a prompt view", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "prompt",
          resourceId: "p1",
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.item.resourceType).toBe("prompt");
      expect(data.item.resourceId).toBe("p1");
    });

    it("records a search view", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "search",
          searchQuery: "hello world",
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.item.resourceType).toBe("search");
      expect(data.item.searchQuery).toBe("hello world");
    });

    it("records with optional source field", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "prompt",
          resourceId: "p1",
          source: "homepage",
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(data.item.source).toBe("homepage");
    });

    it("returns 400 for missing resourceType", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({ resourceId: "p1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("resourceType");
    });

    it("returns 400 for invalid resourceType", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({ resourceType: "invalid", resourceId: "p1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("resource type");
    });

    it("returns 400 when resourceId missing for non-search type", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({ resourceType: "prompt" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("resourceId");
    });

    it("returns 400 when searchQuery missing for search type", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({ resourceType: "search" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("searchQuery");
    });

    it("returns 400 for resourceId exceeding max length", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "prompt",
          resourceId: "x".repeat(201),
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for searchQuery exceeding max length", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "search",
          searchQuery: "x".repeat(501),
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for source exceeding max length", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "prompt",
          resourceId: "p1",
          source: "x".repeat(101),
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: "not json",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("JSON");
    });

    it("trims whitespace from fields", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: userCookie },
        body: JSON.stringify({
          resourceType: "  prompt  ",
          resourceId: "  p1  ",
          source: "  homepage  ",
        }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.item.resourceType).toBe("prompt");
      expect(data.item.resourceId).toBe("p1");
      expect(data.item.source).toBe("homepage");
    });
  });

  // -----------------------------------------------------------------------
  // GET
  // -----------------------------------------------------------------------

  describe("GET", () => {
    async function seedView(resourceType: string, resourceId: string) {
      await POST(
        makeRequest("http://localhost/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: userCookie },
          body: JSON.stringify({ resourceType, resourceId }),
        })
      );
    }

    it("returns empty items for new user", async () => {
      const req = makeRequest("http://localhost/api/history", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("returns recorded views", async () => {
      await seedView("prompt", "p1");
      await seedView("prompt", "p2");

      const req = makeRequest("http://localhost/api/history", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.items).toHaveLength(2);
      expect(data.count).toBe(2);
    });

    it("filters by resourceType", async () => {
      await seedView("prompt", "p1");
      await seedView("bundle", "b1");

      const req = makeRequest("http://localhost/api/history?resourceType=prompt", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].resourceType).toBe("prompt");
    });

    it("returns 400 for invalid resourceType filter", async () => {
      const req = makeRequest("http://localhost/api/history?resourceType=invalid", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("respects limit parameter", async () => {
      await seedView("prompt", "p1");
      await seedView("prompt", "p2");
      await seedView("prompt", "p3");

      const req = makeRequest("http://localhost/api/history?limit=2", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      const data = await res.json();

      expect(data.items).toHaveLength(2);
    });

    it("sets private cache control header", async () => {
      const req = makeRequest("http://localhost/api/history", {
        headers: { cookie: userCookie },
      });
      const res = await GET(req);
      expect(res.headers.get("Cache-Control")).toContain("private");
    });
  });

  // -----------------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------------

  describe("DELETE", () => {
    it("clears all history", async () => {
      // Seed some history
      await POST(
        makeRequest("http://localhost/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: userCookie },
          body: JSON.stringify({ resourceType: "prompt", resourceId: "p1" }),
        })
      );

      const delReq = makeRequest("http://localhost/api/history", {
        method: "DELETE",
        headers: { cookie: userCookie },
      });
      const delRes = await DELETE(delReq);
      const delData = await delRes.json();

      expect(delRes.status).toBe(200);
      expect(delData.success).toBe(true);

      // Verify cleared
      const getReq = makeRequest("http://localhost/api/history", {
        headers: { cookie: userCookie },
      });
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      expect(getData.items).toEqual([]);
    });

    it("is idempotent on empty history", async () => {
      const req = makeRequest("http://localhost/api/history", {
        method: "DELETE",
        headers: { cookie: userCookie },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
    });
  });
});
