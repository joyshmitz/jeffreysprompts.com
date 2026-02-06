/**
 * Unit tests for /api/ratings/leaderboard route (GET)
 * @module api/ratings/leaderboard/route.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// ---------------------------------------------------------------------------
// Mock the rating store and prompt registry
// (Data must be inline – vi.mock factories are hoisted above variable decls)
// ---------------------------------------------------------------------------

vi.mock("@jeffreysprompts/core/prompts/registry", () => ({
  prompts: [
    { id: "p1", title: "Prompt A", slug: "prompt-a" },
    { id: "p2", title: "Prompt B", slug: "prompt-b" },
    { id: "p3", title: "Prompt C", slug: "prompt-c" },
  ],
}));

vi.mock("@/lib/ratings/rating-store", () => ({
  getRatingSummary: ({ contentId }: { contentType: string; contentId: string }) => {
    const ratings: Record<string, { upvotes: number; downvotes: number; total: number; approvalRate: number }> = {
      p1: { upvotes: 10, downvotes: 0, total: 10, approvalRate: 100 },
      p2: { upvotes: 7, downvotes: 3, total: 10, approvalRate: 70 },
      p3: { upvotes: 0, downvotes: 0, total: 0, approvalRate: 0 },
    };
    const r = ratings[contentId];
    return r
      ? { contentType: "prompt", contentId, ...r, lastUpdated: null }
      : { contentType: "prompt", contentId, upvotes: 0, downvotes: 0, total: 0, approvalRate: 0, lastUpdated: null };
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("/api/ratings/leaderboard GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns leaderboard sorted by approval rate", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.entries).toHaveLength(2); // p3 has 0 votes, below minVotes=1
    expect(data.entries[0].prompt.id).toBe("p1"); // 100% approval
    expect(data.entries[1].prompt.id).toBe("p2"); // 70% approval
  });

  it("includes generated_at timestamp", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard"));
    const data = await res.json();
    expect(data.generated_at).toBeTruthy();
    expect(new Date(data.generated_at).getTime()).not.toBeNaN();
  });

  it("respects limit parameter", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?limit=1"));
    const data = await res.json();
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].prompt.id).toBe("p1");
  });

  it("clamps limit to max 50", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?limit=999"));
    const data = await res.json();
    // Should still return results (just clamped, not error)
    expect(res.status).toBe(200);
    expect(data.entries.length).toBeLessThanOrEqual(50);
  });

  it("clamps limit to min 1", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?limit=0"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.entries.length).toBeGreaterThanOrEqual(1);
  });

  it("handles non-numeric limit gracefully", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?limit=abc"));
    const data = await res.json();
    expect(res.status).toBe(200);
    // Should fall back to default 10
    expect(data.entries).toBeDefined();
  });

  it("respects minVotes filter", async () => {
    // p1 and p2 have 10 total each, p3 has 0
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?minVotes=10"));
    const data = await res.json();
    expect(data.entries).toHaveLength(2);
  });

  it("filters out prompts below minVotes threshold", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?minVotes=100"));
    const data = await res.json();
    expect(data.entries).toHaveLength(0);
  });

  it("sets cache control headers", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard"));
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
    expect(res.headers.get("Cache-Control")).toContain("stale-while-revalidate=120");
  });

  it("includes both prompt and rating data in entries", async () => {
    const res = await GET(makeRequest("http://localhost/api/ratings/leaderboard?limit=1"));
    const data = await res.json();
    const entry = data.entries[0];
    expect(entry.prompt).toBeDefined();
    expect(entry.prompt.id).toBe("p1");
    expect(entry.rating).toBeDefined();
    expect(entry.rating.approvalRate).toBe(100);
    expect(entry.rating.total).toBe(10);
  });
});
