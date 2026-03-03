/**
 * Tests for FinalCtaSection component.
 *
 * Covers: headline, subtext, CTA buttons/links, CLI install command,
 * external link attributes.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinalCtaSection } from "./FinalCtaSection";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileInView,
        viewport,
        whileHover,
        whileTap,
        ...rest
      } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FinalCtaSection", () => {
  it("renders headline", () => {
    render(<FinalCtaSection />);
    expect(
      screen.getByRole("heading", { level: 2 })
    ).toHaveTextContent("Supercharge your AI workflow today");
  });

  it("renders subtext", () => {
    render(<FinalCtaSection />);
    expect(
      screen.getByText(/Join thousands of developers/)
    ).toBeInTheDocument();
  });

  it("renders Ready to level up badge", () => {
    render(<FinalCtaSection />);
    expect(screen.getByText("Ready to level up?")).toBeInTheDocument();
  });

  it("has Explore Prompts link to homepage", () => {
    render(<FinalCtaSection />);
    const link = screen.getByText("Explore Prompts").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  it("has Try Pro Free external link", () => {
    render(<FinalCtaSection />);
    const link = screen.getByText("Try Pro Free").closest("a");
    expect(link).toHaveAttribute("href", "https://pro.jeffreysprompts.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows CLI install command", () => {
    render(<FinalCtaSection />);
    expect(
      screen.getByText(/curl -fsSL jeffreysprompts\.com\/install-cli\.sh/)
    ).toBeInTheDocument();
  });
});
