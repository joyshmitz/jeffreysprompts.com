
import { describe, expect, test } from "bun:test";
import { tokenize } from "../../src/search/tokenize";

describe("tokenize with hyphen fix", () => {
  test("splits hyphenated words", () => {
    // Before fix: ["idea-wizard"]
    // After fix: ["idea", "wizard"]
    const tokens = tokenize("idea-wizard");
    expect(tokens).toContain("idea");
    expect(tokens).toContain("wizard");
    expect(tokens).not.toContain("idea-wizard");
  });

  test("handles normal words", () => {
    const tokens = tokenize("hello world");
    expect(tokens).toEqual(["hello", "world"]);
  });

  test("handles mixed punctuation", () => {
    const tokens = tokenize("hello-world.foo_bar");
    // "hello", "world", "foo", "bar" (underscore is usually \w but my regex replaces non-L/N)
    // Regex: [^\p{L}\p{N}\s] -> " "
    // _ is not \p{L} or \p{N}. So it becomes space.
    expect(tokens).toEqual(["hello", "world", "foo", "bar"]);
  });

  test("search for 'idea' matches 'idea-wizard'", () => {
    const idTokens = tokenize("idea-wizard");
    const searchTokens = tokenize("idea");
    const match = searchTokens.every(t => idTokens.includes(t));
    expect(match).toBe(true);
  });
});
