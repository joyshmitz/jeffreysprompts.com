import { describe, it, expect } from "bun:test";
import {
  suggestPromptMetadata,
  findDuplicateCandidates,
} from "../../src/prompts/metadata";
import type { Prompt } from "../../src/prompts/types";

function makePrompt(partial: Partial<Prompt> & Pick<Prompt, "id" | "title" | "content" | "category" | "tags">): Prompt {
  return {
    description: "",
    author: "Jeff",
    version: "1.0.0",
    created: "2025-01-01",
    ...partial,
  };
}

describe("metadata assistant", () => {
  it("suggests tags and categories from similar prompts", () => {
    const base = makePrompt({
      id: "readme-reviser",
      title: "README Reviser",
      description: "Update docs",
      content: "Update the README and documentation to match the codebase.",
      category: "documentation",
      tags: ["readme", "docs", "documentation"],
    });

    const target = makePrompt({
      id: "readme-updater",
      title: "README Updater",
      description: "Keep docs aligned",
      content: "Update the README to reflect changes and keep docs accurate.",
      category: "documentation",
      tags: ["readme"],
    });

    const suggestions = suggestPromptMetadata(target, [base, target], {
      maxSimilar: 3,
      maxTagSuggestions: 5,
      similarityThreshold: 0.1,
    });

    expect(suggestions.tags.some((item) => item.tag === "docs")).toBe(true);
    expect(suggestions.categories.length).toBeGreaterThan(0);
  });

  it("detects near-duplicate prompts", () => {
    const one = makePrompt({
      id: "dup-a",
      title: "Idea Wizard",
      content: "Generate 10 ideas and evaluate them thoroughly.",
      category: "ideation",
      tags: ["ideas"],
    });

    const two = makePrompt({
      id: "dup-b",
      title: "Idea Wizard Copy",
      content: "Generate 10 ideas and evaluate them thoroughly.",
      category: "ideation",
      tags: ["brainstorm"],
    });

    const pairs = findDuplicateCandidates([one, two], { minScore: 0.85, maxPairs: 5 });

    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0].score).toBeGreaterThanOrEqual(0.85);
    expect([pairs[0].promptA.id, pairs[0].promptB.id].sort()).toEqual(["dup-a", "dup-b"]);
  });
});
