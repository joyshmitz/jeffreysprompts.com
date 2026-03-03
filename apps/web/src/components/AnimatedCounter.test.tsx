/**
 * Tests for AnimatedCounter component.
 *
 * Covers: initial render, prefix, suffix, className.
 * Note: Spring animation behavior is tested indirectly
 * since we mock framer-motion.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedCounter } from "./AnimatedCounter";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  useInView: () => true,
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: vi.fn(),
    on: () => () => {},
  }),
  useSpring: (motionValue: { get: () => number }) => ({
    get: () => motionValue.get(),
    set: vi.fn(),
    on: (_event: string, cb: (val: number) => void) => {
      // Immediately fire the change callback with the initial value
      cb(0);
      return () => {};
    },
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AnimatedCounter", () => {
  it("renders initial value of 0", () => {
    render(<AnimatedCounter value={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders with prefix", () => {
    const { container } = render(
      <AnimatedCounter value={50} prefix="$" />
    );
    expect(container.textContent).toContain("$");
  });

  it("renders with suffix", () => {
    const { container } = render(
      <AnimatedCounter value={99} suffix="%" />
    );
    expect(container.textContent).toContain("%");
  });

  it("renders with prefix and suffix", () => {
    const { container } = render(
      <AnimatedCounter value={42} prefix="~" suffix="+" />
    );
    expect(container.textContent).toContain("~");
    expect(container.textContent).toContain("+");
  });

  it("applies className to container", () => {
    const { container } = render(
      <AnimatedCounter value={10} className="stat-counter" />
    );
    expect(container.firstElementChild).toHaveAttribute(
      "class",
      "stat-counter"
    );
  });
});
