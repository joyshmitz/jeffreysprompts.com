/**
 * Tests for FeaturesSection landing page component
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FeaturesSection } from "./FeaturesSection";

describe("FeaturesSection", () => {
  it("renders section heading", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Everything you need for prompt engineering")).toBeDefined();
  });

  it("renders Features badge", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Features")).toBeDefined();
  });

  it("renders all 8 feature titles", () => {
    render(<FeaturesSection />);
    const expectedFeatures = [
      "Prompt Packs",
      "Claude Code Skills",
      "Swap Meet",
      "Collections",
      "CLI Integration",
      "Analytics",
      "Smart Search",
      "Zero Config",
    ];
    for (const title of expectedFeatures) {
      expect(screen.getByText(title)).toBeDefined();
    }
  });

  it("renders feature descriptions", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/Curated bundles of battle-tested prompts/)).toBeDefined();
    expect(screen.getByText(/BM25-powered fuzzy search/)).toBeDefined();
  });
});
