/**
 * Tests for PricingPreviewSection landing page component
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PricingPreviewSection } from "./PricingPreviewSection";

describe("PricingPreviewSection", () => {
  it("renders section heading", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Simple, transparent pricing")).toBeDefined();
  });

  it("renders Pricing badge", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Pricing")).toBeDefined();
  });

  it("renders Free plan", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Free")).toBeDefined();
    expect(screen.getByText("$0")).toBeDefined();
  });

  it("renders Pro plan", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Pro")).toBeDefined();
    expect(screen.getByText("$10")).toBeDefined();
  });

  it("renders Best Value badge for Pro", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Best Value")).toBeDefined();
  });

  it("renders plan features", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Full prompt library access")).toBeDefined();
    expect(screen.getByText("Unlimited collections")).toBeDefined();
    expect(screen.getByText("Analytics dashboard")).toBeDefined();
  });

  it("renders CTA buttons", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("Browse Prompts")).toBeDefined();
    expect(screen.getByText("Go Pro")).toBeDefined();
  });

  it("renders full pricing link", () => {
    render(<PricingPreviewSection />);
    expect(screen.getByText("View full pricing details")).toBeDefined();
  });
});
