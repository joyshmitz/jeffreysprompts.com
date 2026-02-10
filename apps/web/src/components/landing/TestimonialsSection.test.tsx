/**
 * Tests for TestimonialsSection landing page component
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TestimonialsSection } from "./TestimonialsSection";

describe("TestimonialsSection", () => {
  it("renders section heading", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Loved by developers worldwide")).toBeDefined();
  });

  it("renders Testimonials badge", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Testimonials")).toBeDefined();
  });

  it("renders all 3 testimonial authors", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Alex Chen")).toBeDefined();
    expect(screen.getByText("Sarah Miller")).toBeDefined();
    expect(screen.getByText("Michael Kim")).toBeDefined();
  });

  it("renders author roles and companies", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText(/Senior Developer.*TechCorp/)).toBeDefined();
    expect(screen.getByText(/AI Engineer.*StartupAI/)).toBeDefined();
    expect(screen.getByText(/Tech Lead.*DevFlow/)).toBeDefined();
  });

  it("renders testimonial quotes", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText(/JeffreysPrompts has become essential/)).toBeDefined();
    expect(screen.getByText(/The CLI integration is brilliant/)).toBeDefined();
  });

  it("renders author initials as avatars", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("AC")).toBeDefined();
    expect(screen.getByText("SM")).toBeDefined();
    expect(screen.getByText("MK")).toBeDefined();
  });
});
