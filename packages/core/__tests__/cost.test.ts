import { describe, it, expect } from "bun:test";
import { estimateCost, estimatePromptTokens } from "../src/cost";
import { getPrompt } from "../src/prompts";
import type { Prompt } from "../src/prompts/types";

describe("cost estimator", () => {
  it("uses declared estimatedTokens when present", () => {
    const prompt = getPrompt("idea-wizard");
    expect(prompt).toBeDefined();
    const estimate = estimatePromptTokens(prompt as Prompt);
    expect(estimate?.source).toBe("declared");
    expect(estimate?.tokens).toBe((prompt as Prompt).estimatedTokens);
  });

  it("falls back to heuristic token estimation when missing", () => {
    const content = "abcd".repeat(10); // 40 chars
    const prompt: Prompt = {
      id: "test-prompt",
      title: "Test Prompt",
      description: "Test description",
      category: "workflow",
      tags: ["test"],
      author: "Test",
      version: "1.0.0",
      created: "2026-01-31",
      content,
    };

    const estimate = estimatePromptTokens(prompt);
    expect(estimate?.source).toBe("heuristic");
    expect(estimate?.tokens).toBe(10);
  });

  it("calculates cost from custom pricing table", () => {
    const estimate = estimateCost({
      model: "test-model",
      inputTokens: 500,
      outputTokens: 250,
      pricingTable: {
        "test-model": { inputPer1k: 2, outputPer1k: 4, currency: "USD" },
      },
    });

    expect(estimate).toBeDefined();
    expect(estimate?.inputCost).toBe(1);
    expect(estimate?.outputCost).toBe(1);
    expect(estimate?.totalCost).toBe(2);
  });

  it("returns null when model pricing is missing", () => {
    const estimate = estimateCost({ model: "unknown", inputTokens: 100 });
    expect(estimate).toBeNull();
  });
});
