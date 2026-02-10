/**
 * Tests for HowItWorksSection landing page component
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HowItWorksSection } from "./HowItWorksSection";

describe("HowItWorksSection", () => {
  it("renders section heading", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("From search to ship in seconds")).toBeDefined();
  });

  it("renders How It Works badge", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("How It Works")).toBeDefined();
  });

  it("renders all 3 steps", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Browse & Search")).toBeDefined();
    expect(screen.getByText("Copy or Export")).toBeDefined();
    expect(screen.getByText("Supercharge Your Workflow")).toBeDefined();
  });

  it("renders step numbers", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Step 01")).toBeDefined();
    expect(screen.getByText("Step 02")).toBeDefined();
    expect(screen.getByText("Step 03")).toBeDefined();
  });

  it("renders step descriptions", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/Explore our curated library/)).toBeDefined();
    expect(screen.getByText(/One-click copy to clipboard/)).toBeDefined();
  });
});
