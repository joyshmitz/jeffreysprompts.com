/**
 * Tests for AnimatedSection and AnimatedItem components.
 *
 * Covers: children rendering, reduced motion passthrough,
 * className forwarding, stagger mode.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockReducedMotion = false;

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        ref,
        layout,
        ...rest
      } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  useReducedMotion: () => mockReducedMotion,
}));

// ---------------------------------------------------------------------------
// Tests – AnimatedSection
// ---------------------------------------------------------------------------

describe("AnimatedSection", () => {
  it("renders children", () => {
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("passes className to container", () => {
    const { container } = render(
      <AnimatedSection className="my-section">
        <p>Content</p>
      </AnimatedSection>
    );
    expect(container.firstElementChild).toHaveAttribute("class", "my-section");
  });

  it("renders children directly in reduced motion mode", () => {
    mockReducedMotion = true;
    render(
      <AnimatedSection>
        <p>Static Content</p>
      </AnimatedSection>
    );
    expect(screen.getByText("Static Content")).toBeInTheDocument();
    mockReducedMotion = false;
  });

  it("renders stagger children when stagger is true", () => {
    render(
      <AnimatedSection stagger>
        <p>Child 1</p>
        <p>Child 2</p>
      </AnimatedSection>
    );
    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests – AnimatedItem
// ---------------------------------------------------------------------------

describe("AnimatedItem", () => {
  it("renders children", () => {
    render(
      <AnimatedItem>
        <span>Animated</span>
      </AnimatedItem>
    );
    expect(screen.getByText("Animated")).toBeInTheDocument();
  });

  it("passes className to container", () => {
    const { container } = render(
      <AnimatedItem className="item-class">
        <span>Content</span>
      </AnimatedItem>
    );
    expect(container.firstElementChild).toHaveAttribute("class", "item-class");
  });

  it("renders children directly in reduced motion mode", () => {
    mockReducedMotion = true;
    render(
      <AnimatedItem>
        <span>No animation</span>
      </AnimatedItem>
    );
    expect(screen.getByText("No animation")).toBeInTheDocument();
    mockReducedMotion = false;
  });
});
