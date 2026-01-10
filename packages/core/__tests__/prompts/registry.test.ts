import { describe, it, expect } from "bun:test";
import {
  prompts,
  categories,
  tags,
  featuredPrompts,
  promptsById,
  getPrompt,
  getPromptsByCategory,
  getPromptsByTag,
  searchPromptsByText,
} from "../../src/prompts/registry";

describe("prompts array", () => {
  it("should have at least one prompt", () => {
    expect(prompts.length).toBeGreaterThan(0);
  });

  it("should have unique IDs", () => {
    const ids = prompts.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have required fields on all prompts", () => {
    for (const prompt of prompts) {
      expect(prompt.id).toBeTruthy();
      expect(prompt.title).toBeTruthy();
      expect(prompt.description).toBeTruthy();
      expect(prompt.category).toBeTruthy();
      expect(prompt.content).toBeTruthy();
      expect(Array.isArray(prompt.tags)).toBe(true);
    }
  });

  it("should have valid categories", () => {
    const validCategories = [
      "ideation",
      "documentation",
      "automation",
      "refactoring",
      "testing",
      "debugging",
      "workflow",
      "communication",
    ];
    for (const prompt of prompts) {
      expect(validCategories).toContain(prompt.category);
    }
  });
});

describe("computed exports", () => {
  it("categories should be sorted and unique", () => {
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("tags should be unique", () => {
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("featuredPrompts should only include featured prompts", () => {
    for (const prompt of featuredPrompts) {
      expect(prompt.featured).toBe(true);
    }
  });

  it("promptsById should map all prompts by ID", () => {
    expect(promptsById.size).toBe(prompts.length);
    for (const prompt of prompts) {
      expect(promptsById.get(prompt.id)).toBe(prompt);
    }
  });
});

describe("getPrompt", () => {
  it("should return prompt by ID", () => {
    const prompt = getPrompt("idea-wizard");
    expect(prompt).toBeDefined();
    expect(prompt?.id).toBe("idea-wizard");
    expect(prompt?.title).toBe("The Idea Wizard");
  });

  it("should return undefined for non-existent ID", () => {
    const prompt = getPrompt("non-existent");
    expect(prompt).toBeUndefined();
  });
});

describe("getPromptsByCategory", () => {
  it("should return prompts in category", () => {
    const ideation = getPromptsByCategory("ideation");
    expect(ideation.length).toBeGreaterThan(0);
    for (const prompt of ideation) {
      expect(prompt.category).toBe("ideation");
    }
  });

  it("should return empty array for non-existent category", () => {
    const result = getPromptsByCategory("nonexistent" as any);
    expect(result).toEqual([]);
  });
});

describe("getPromptsByTag", () => {
  it("should return prompts with tag", () => {
    const ultrathink = getPromptsByTag("ultrathink");
    expect(ultrathink.length).toBeGreaterThan(0);
    for (const prompt of ultrathink) {
      expect(prompt.tags).toContain("ultrathink");
    }
  });

  it("should return empty array for non-existent tag", () => {
    const result = getPromptsByTag("nonexistent-tag");
    expect(result).toEqual([]);
  });
});

describe("searchPromptsByText", () => {
  it("should search in title", () => {
    const results = searchPromptsByText("Wizard");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.id === "idea-wizard")).toBe(true);
  });

  it("should search in description", () => {
    const results = searchPromptsByText("documentation");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.id === "readme-reviser")).toBe(true);
  });

  it("should search in tags", () => {
    const results = searchPromptsByText("brainstorming");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.id === "idea-wizard")).toBe(true);
  });

  it("should be case-insensitive", () => {
    const lower = searchPromptsByText("wizard");
    const upper = searchPromptsByText("WIZARD");
    expect(lower.length).toBe(upper.length);
  });

  it("should return empty array for no matches", () => {
    const results = searchPromptsByText("xyznonexistent123");
    expect(results).toEqual([]);
  });
});
