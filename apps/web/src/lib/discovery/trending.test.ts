/**
 * Unit tests for trending algorithm
 * @module lib/discovery/trending.test
 */

import { describe, it, expect } from "vitest";
import type { CommunityPrompt } from "@/lib/swap-meet/types";
import {
  calculateTrendingScore,
  getTrendingPrompts,
  getTrendingPromptsWithScores,
  sortByTrending,
} from "./trending";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePrompt(overrides: Partial<CommunityPrompt> = {}): CommunityPrompt {
  return {
    id: `prompt-${crypto.randomUUID().slice(0, 8)}`,
    title: "Test Prompt",
    description: "A test prompt",
    content: "Do something useful.",
    category: "ideation",
    tags: ["test"],
    author: {
      id: "a1",
      username: "user1",
      displayName: "User 1",
      avatarUrl: null,
      reputation: 0,
    },
    stats: {
      views: 100,
      copies: 50,
      saves: 25,
      rating: 4.0,
      ratingCount: 10,
    },
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const now = new Date("2026-02-01T12:00:00Z");

// ---------------------------------------------------------------------------
// calculateTrendingScore
// ---------------------------------------------------------------------------

describe("calculateTrendingScore", () => {
  const context = { maxViews: 1000, maxCopies: 500, maxSaves: 200, maxRatingCount: 50, now };

  it("returns a score breakdown with all components", () => {
    const prompt = makePrompt({ updatedAt: now.toISOString() });
    const result = calculateTrendingScore(prompt, context);

    expect(result.promptId).toBe(prompt.id);
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.totalScore).toBeLessThanOrEqual(1);
    expect(result.components.viewScore).toBeGreaterThanOrEqual(0);
    expect(result.components.copyScore).toBeGreaterThanOrEqual(0);
    expect(result.components.saveScore).toBeGreaterThanOrEqual(0);
    expect(result.components.ratingScore).toBeGreaterThanOrEqual(0);
    expect(result.components.freshnessScore).toBeGreaterThanOrEqual(0);
    expect(result.weights).toBeDefined();
  });

  it("normalizes scores relative to max values", () => {
    const low = makePrompt({
      stats: { views: 10, copies: 5, saves: 2, rating: 2.0, ratingCount: 1 },
      updatedAt: now.toISOString(),
    });
    const high = makePrompt({
      stats: { views: 1000, copies: 500, saves: 200, rating: 5.0, ratingCount: 50 },
      updatedAt: now.toISOString(),
    });

    const lowScore = calculateTrendingScore(low, context);
    const highScore = calculateTrendingScore(high, context);

    expect(highScore.totalScore).toBeGreaterThan(lowScore.totalScore);
  });

  it("gives higher freshness to recent content", () => {
    const recent = makePrompt({ updatedAt: now.toISOString() });
    const old = makePrompt({ updatedAt: "2025-01-01T00:00:00Z" });

    const recentScore = calculateTrendingScore(recent, context);
    const oldScore = calculateTrendingScore(old, context);

    expect(recentScore.components.freshnessScore).toBeGreaterThan(
      oldScore.components.freshnessScore
    );
  });

  it("handles zero stats gracefully", () => {
    const zeroPrompt = makePrompt({
      stats: { views: 0, copies: 0, saves: 0, rating: 0, ratingCount: 0 },
      updatedAt: now.toISOString(),
    });
    const result = calculateTrendingScore(zeroPrompt, context);

    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.totalScore)).toBe(true);
  });

  it("handles invalid updatedAt date", () => {
    const badDate = makePrompt({ updatedAt: "invalid-date" });
    const result = calculateTrendingScore(badDate, context);

    expect(Number.isFinite(result.totalScore)).toBe(true);
    // Should get minimum freshness for invalid date
    expect(result.components.freshnessScore).toBeCloseTo(0.1, 1);
  });

  it("handles max=0 context (prevents division by zero)", () => {
    const prompt = makePrompt({ updatedAt: now.toISOString() });
    const zeroCtx = { maxViews: 0, maxCopies: 0, maxSaves: 0, maxRatingCount: 0, now };
    const result = calculateTrendingScore(prompt, zeroCtx);

    expect(Number.isFinite(result.totalScore)).toBe(true);
  });

  it("applies rating confidence weighting", () => {
    // Same rating value, different confidence
    const fewRatings = makePrompt({
      stats: { views: 100, copies: 50, saves: 25, rating: 5.0, ratingCount: 1 },
      updatedAt: now.toISOString(),
    });
    const manyRatings = makePrompt({
      stats: { views: 100, copies: 50, saves: 25, rating: 5.0, ratingCount: 50 },
      updatedAt: now.toISOString(),
    });

    const fewScore = calculateTrendingScore(fewRatings, context);
    const manyScore = calculateTrendingScore(manyRatings, context);

    // More ratings = more confidence = closer to actual rating
    expect(manyScore.components.ratingScore).toBeGreaterThan(
      fewScore.components.ratingScore
    );
  });
});

// ---------------------------------------------------------------------------
// getTrendingPrompts
// ---------------------------------------------------------------------------

describe("getTrendingPrompts", () => {
  it("returns prompts sorted by trending score", () => {
    const low = makePrompt({
      id: "low",
      stats: { views: 1, copies: 0, saves: 0, rating: 1, ratingCount: 0 },
      updatedAt: "2025-01-01T00:00:00Z",
    });
    const high = makePrompt({
      id: "high",
      stats: { views: 1000, copies: 500, saves: 200, rating: 5, ratingCount: 50 },
      updatedAt: now.toISOString(),
    });

    const result = getTrendingPrompts([low, high], { now });
    expect(result[0].id).toBe("high");
    expect(result[1].id).toBe("low");
  });

  it("respects limit option", () => {
    const prompts = Array.from({ length: 10 }, (_, i) =>
      makePrompt({
        id: `p${i}`,
        stats: { views: (i + 1) * 10, copies: 0, saves: 0, rating: 3, ratingCount: 1 },
        updatedAt: now.toISOString(),
      })
    );

    const result = getTrendingPrompts(prompts, { limit: 3, now });
    expect(result).toHaveLength(3);
  });

  it("filters by category", () => {
    const writing = makePrompt({ id: "w", category: "automation", updatedAt: now.toISOString() });
    const coding = makePrompt({ id: "c", category: "debugging", updatedAt: now.toISOString() });

    const result = getTrendingPrompts([writing, coding], { category: "automation", now });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("w");
  });

  it("excludes specified IDs", () => {
    const p1 = makePrompt({ id: "p1", updatedAt: now.toISOString() });
    const p2 = makePrompt({ id: "p2", updatedAt: now.toISOString() });

    const result = getTrendingPrompts([p1, p2], { excludeIds: ["p1"], now });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2");
  });

  it("filters by minimum score", () => {
    const low = makePrompt({
      id: "low",
      stats: { views: 0, copies: 0, saves: 0, rating: 0, ratingCount: 0 },
      updatedAt: "2020-01-01T00:00:00Z",
    });
    const high = makePrompt({
      id: "high",
      stats: { views: 1000, copies: 500, saves: 200, rating: 5, ratingCount: 50 },
      updatedAt: now.toISOString(),
    });

    const result = getTrendingPrompts([low, high], { minScore: 0.5, now });
    expect(result.every((p) => p.id !== "low")).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(getTrendingPrompts([], { now })).toEqual([]);
  });

  it("handles single prompt", () => {
    const single = makePrompt({ updatedAt: now.toISOString() });
    const result = getTrendingPrompts([single], { now });
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getTrendingPromptsWithScores
// ---------------------------------------------------------------------------

describe("getTrendingPromptsWithScores", () => {
  it("returns prompts with score breakdowns", () => {
    const prompt = makePrompt({ updatedAt: now.toISOString() });
    const result = getTrendingPromptsWithScores([prompt], { now });

    expect(result).toHaveLength(1);
    expect(result[0].prompt).toBeDefined();
    expect(result[0].score).toBeDefined();
    expect(result[0].score.totalScore).toBeGreaterThan(0);
    expect(result[0].score.components).toBeDefined();
  });

  it("respects limit", () => {
    const prompts = Array.from({ length: 5 }, () =>
      makePrompt({ updatedAt: now.toISOString() })
    );
    const result = getTrendingPromptsWithScores(prompts, { limit: 2, now });
    expect(result).toHaveLength(2);
  });

  it("filters by category", () => {
    const w = makePrompt({ category: "automation", updatedAt: now.toISOString() });
    const c = makePrompt({ category: "debugging", updatedAt: now.toISOString() });
    const result = getTrendingPromptsWithScores([w, c], { category: "debugging", now });
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// sortByTrending
// ---------------------------------------------------------------------------

describe("sortByTrending", () => {
  it("sorts prompts by trending score (descending)", () => {
    const low = makePrompt({
      id: "low",
      stats: { views: 1, copies: 0, saves: 0, rating: 1, ratingCount: 0 },
      updatedAt: "2025-01-01T00:00:00Z",
    });
    const high = makePrompt({
      id: "high",
      stats: { views: 500, copies: 200, saves: 100, rating: 5, ratingCount: 30 },
      updatedAt: now.toISOString(),
    });

    const result = sortByTrending([low, high], now);
    expect(result[0].id).toBe("high");
  });

  it("returns empty array for empty input", () => {
    expect(sortByTrending([])).toEqual([]);
  });
});
