/**
 * Unit tests for /api/prompts route (GET)
 * @module api/prompts/route.test
 *
 * Uses real registry data via submodule imports, injected through vi.mock
 * to avoid zod import chain from barrel modules.
 * Only node:crypto is mocked for deterministic ETag generation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prompts } from "@jeffreysprompts/core/prompts/registry";
import { GET } from "./route";

// Provide real registry data for the barrel import used by the route handler
vi.mock("@jeffreysprompts/core/prompts", async () => {
  const registry = await vi.importActual<typeof import("@jeffreysprompts/core/prompts/registry")>(
    "@jeffreysprompts/core/prompts/registry"
  );
  const bundlesMod = await vi.importActual<typeof import("@jeffreysprompts/core/prompts/bundles")>(
    "@jeffreysprompts/core/prompts/bundles"
  );
  const workflowsMod = await vi.importActual<typeof import("@jeffreysprompts/core/prompts/workflows")>(
    "@jeffreysprompts/core/prompts/workflows"
  );
  return {
    ...registry,
    ...bundlesMod,
    ...workflowsMod,
  };
});

// Provide real export functions by redirecting to the actual module
vi.mock("@jeffreysprompts/core/export", async () => {
  return vi.importActual("@jeffreysprompts/core/export");
});

// Only mock crypto for deterministic ETag values
vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    default: {
      ...actual,
      createHash: () => ({
        update: () => ({
          digest: () => "abcdef01",
        }),
      }),
    },
    createHash: () => ({
      update: () => ({
        digest: () => "abcdef01",
      }),
    }),
  };
});

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers });
}

// Pick real data for filter tests
const ideationPrompts = prompts.filter((p) => p.category === "ideation");
const nonIdeationPrompts = prompts.filter((p) => p.category !== "ideation");
const featuredPrompts = prompts.filter((p) => p.featured);
const nonFeaturedPrompts = prompts.filter((p) => !p.featured);

// Find a tag present on some but not all prompts
const tagForFilter = "brainstorming";
const promptsWithTag = prompts.filter((p) => p.tags.includes(tagForFilter));

describe("/api/prompts GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with full registry", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(prompts.length);
    expect(data.meta).toBeDefined();
    expect(data.meta.promptCount).toBe(prompts.length);
  });

  it("returns minimal list when minimal=true", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts?minimal=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(prompts.length);
    expect(data.meta.count).toBe(prompts.length);
  });

  it("filters by category", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts?category=ideation"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(ideationPrompts.length);

    const ids = data.prompts.map((p: { id: string }) => p.id);
    for (const p of ideationPrompts) {
      expect(ids).toContain(p.id);
    }
    for (const p of nonIdeationPrompts) {
      expect(ids).not.toContain(p.id);
    }
  });

  it("filters by tag", async () => {
    const res = await GET(makeRequest(`http://localhost/api/prompts?tag=${tagForFilter}`));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(promptsWithTag.length);
    for (const p of data.prompts) {
      expect(p.tags).toContain(tagForFilter);
    }
  });

  it("filters by featured", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts?featured=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(featuredPrompts.length);

    const ids = data.prompts.map((p: { id: string }) => p.id);
    for (const p of featuredPrompts) {
      expect(ids).toContain(p.id);
    }
    for (const p of nonFeaturedPrompts) {
      expect(ids).not.toContain(p.id);
    }
  });

  it("filters minimal list by category", async () => {
    const docPrompts = prompts.filter((p) => p.category === "documentation");
    const res = await GET(makeRequest("http://localhost/api/prompts?minimal=true&category=documentation"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prompts).toHaveLength(docPrompts.length);
    expect(data.meta.count).toBe(docPrompts.length);
  });

  it("sets ETag header", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts"));

    expect(res.headers.get("ETag")).toBeTruthy();
  });

  it("returns 304 when ETag matches", async () => {
    const firstRes = await GET(makeRequest("http://localhost/api/prompts"));
    const etag = firstRes.headers.get("ETag")!;

    const secondRes = await GET(makeRequest("http://localhost/api/prompts", { "if-none-match": etag }));
    expect(secondRes.status).toBe(304);
  });

  it("sets cache-control headers", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts"));

    expect(res.headers.get("Cache-Control")).toContain("public");
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
    expect(res.headers.get("Cache-Control")).toContain("stale-while-revalidate=300");
  });

  it("sets Vary header", async () => {
    const res = await GET(makeRequest("http://localhost/api/prompts"));

    expect(res.headers.get("Vary")).toBe("Accept-Encoding");
  });

  it("generates different ETags for different filter params", async () => {
    const res1 = await GET(makeRequest("http://localhost/api/prompts"));
    const res2 = await GET(makeRequest("http://localhost/api/prompts?category=ideation"));

    expect(res1.headers.get("ETag")).not.toBe(res2.headers.get("ETag"));
  });
});
