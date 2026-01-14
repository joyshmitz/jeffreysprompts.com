
import { describe, it, expect } from "bun:test";
import { tokenize } from "../../src/search/tokenize";

describe("tokenize unicode", () => {
  it("should preserve unicode letters", () => {
    expect(tokenize("café")).toEqual(["café"]);
    expect(tokenize("über")).toEqual(["über"]);
    expect(tokenize("naïve")).toEqual(["naïve"]);
  });

  it("should handle mixed scripts", () => {
    expect(tokenize("hello мир")).toEqual(["hello", "мир"]);
  });

  it("should strip unicode punctuation", () => {
    expect(tokenize("hello—world")).toEqual(["hello", "world"]); // em-dash
  });
});
