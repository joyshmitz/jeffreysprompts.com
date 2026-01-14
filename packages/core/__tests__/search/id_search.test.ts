
import { describe, expect, test } from "bun:test";
import { searchPrompts } from "../../src/search/engine";
import { prompts } from "../../src/prompts/registry";

describe("Search by ID", () => {
  test("exact ID search finds the prompt", () => {
    // "idea-wizard" matches ID exactly
    const results = searchPrompts("idea-wizard");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].prompt.id).toBe("idea-wizard");
    expect(results[0].matchedFields).toContain("id");
  });

  test("partial ID search finds the prompt", () => {
    // "wizard" is part of "idea-wizard"
    const results = searchPrompts("wizard");
    const ideaWizard = results.find(r => r.prompt.id === "idea-wizard");
    expect(ideaWizard).toBeDefined();
    expect(ideaWizard?.matchedFields).toContain("id");
  });

  test("split ID search finds the prompt", () => {
    // "idea" is part of "idea-wizard"
    const results = searchPrompts("idea");
    const ideaWizard = results.find(r => r.prompt.id === "idea-wizard");
    expect(ideaWizard).toBeDefined();
    // It matches "id" because we index "idea" and "wizard" from the ID now?
    // In bm25.ts: textParts includes prompt.id (repeated).
    // In tokenize: prompt.id "idea-wizard" -> ["idea", "wizard"].
    // So "idea" is in the ID tokens.
    expect(ideaWizard?.matchedFields).toContain("id");
  });
});
