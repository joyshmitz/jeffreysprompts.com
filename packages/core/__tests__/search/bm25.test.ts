import { describe, it, expect } from "bun:test";
import { buildIndex, search } from "../../src/search/bm25";
import type { Prompt } from "../../src/prompts/types";

// Test prompts
const testPrompts: Prompt[] = [
  {
    id: "test-1",
    title: "Testing Framework",
    description: "A comprehensive testing framework",
    category: "testing",
    tags: ["test", "unit", "integration"],
    author: "Test Author",
    twitter: "@test",
    version: "1.0.0",
    created: "2025-01-01",
    content: "Write tests for your code. Include unit tests and integration tests.",
  },
  {
    id: "test-2",
    title: "Documentation Guide",
    description: "How to write great documentation",
    category: "documentation",
    tags: ["docs", "readme", "guide"],
    author: "Test Author",
    twitter: "@test",
    version: "1.0.0",
    created: "2025-01-01",
    content: "Good documentation is essential. Write clear README files.",
  },
  {
    id: "test-3",
    title: "Debug Helper",
    description: "Debug your code effectively",
    category: "debugging",
    tags: ["debug", "fix", "troubleshoot"],
    author: "Test Author",
    twitter: "@test",
    version: "1.0.0",
    created: "2025-01-01",
    content: "Use debugger to find bugs. Fix issues systematically.",
  },
];

describe("buildIndex", () => {
  it("should create an index with all documents", () => {
    const index = buildIndex(testPrompts);
    expect(index.documents.size).toBe(3);
    expect(index.docCount).toBe(3);
  });

  it("should calculate average document length", () => {
    const index = buildIndex(testPrompts);
    expect(index.avgDocLength).toBeGreaterThan(0);
  });

  it("should track term document frequency", () => {
    const index = buildIndex(testPrompts);
    // "test" appears in test-1 multiple times (title boosted 3x)
    expect(index.termDocFreq.has("test")).toBe(true);
  });

  it("should precompute term frequency maps", () => {
    const index = buildIndex(testPrompts);
    const doc = index.documents.get("test-1");
    expect(doc).toBeDefined();
    expect(doc?.termFreq instanceof Map).toBe(true);
    expect(doc?.termFreq.size).toBeGreaterThan(0);
  });
});

describe("search", () => {
  const index = buildIndex(testPrompts);

  it("should return results for matching query", () => {
    const results = search(index, "testing");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should rank title matches higher", () => {
    // "Testing Framework" should rank highest for "testing"
    const results = search(index, "testing");
    expect(results[0].id).toBe("test-1");
  });

  it("should respect limit parameter", () => {
    const results = search(index, "code", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("should return scores", () => {
    const results = search(index, "documentation");
    for (const result of results) {
      expect(result.score).toBeGreaterThan(0);
    }
  });

  it("should return empty array for no matches", () => {
    const results = search(index, "xyznonexistent");
    expect(results).toEqual([]);
  });

  it("should handle multi-word queries", () => {
    const results = search(index, "write tests");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should sort by score descending", () => {
    const results = search(index, "code");
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

describe("BM25 boosting", () => {
  // Test that field weights work correctly
  const boostPrompts: Prompt[] = [
    {
      id: "title-match",
      title: "Specific Query Term",
      description: "General description",
      category: "testing",
      tags: ["generic"],
      author: "Author",
      twitter: "@a",
      version: "1.0.0",
      created: "2025-01-01",
      content: "General content",
    },
    {
      id: "content-match",
      title: "General Title",
      description: "General description",
      category: "testing",
      tags: ["generic"],
      author: "Author",
      twitter: "@a",
      version: "1.0.0",
      created: "2025-01-01",
      content: "Specific query term appears in content",
    },
  ];

  it("should boost title matches over content matches", () => {
    const index = buildIndex(boostPrompts);
    const results = search(index, "specific query term");

    // Title match should rank higher due to 3x boost
    expect(results[0].id).toBe("title-match");
  });
});
