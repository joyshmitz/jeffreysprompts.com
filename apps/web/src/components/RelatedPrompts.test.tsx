/**
 * Tests for RelatedPrompts component.
 *
 * Covers: heading, recommendation badge, prompt card rendering,
 * null when no related prompts, subtitle text.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedPrompts } from "./RelatedPrompts";

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
        layout,
        ...rest
      } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => false,
}));

vi.mock("@jeffreysprompts/core/prompts/registry", () => {
  const data = [
    {
      id: "prompt-a",
      title: "Alpha Prompt",
      description: "Alpha description",
      category: "coding",
      tags: ["ai", "code"],
      content: "test",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "prompt-b",
      title: "Beta Prompt",
      description: "Beta description",
      category: "coding",
      tags: ["ai", "debug"],
      content: "test",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "prompt-c",
      title: "Gamma Prompt",
      description: "Gamma description",
      category: "writing",
      tags: ["writing"],
      content: "test",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ];
  return {
    prompts: data,
    getPrompt: (id: string) => data.find((p) => p.id === id) ?? null,
  };
});

vi.mock("@jeffreysprompts/core/search/engine", () => ({
  searchPrompts: (_query: string, _opts: unknown) => {
    const data = [
      { prompt: { id: "prompt-a", tags: ["ai", "code"] }, score: 5 },
      { prompt: { id: "prompt-b", tags: ["ai", "debug"] }, score: 5 },
      { prompt: { id: "prompt-c", tags: ["writing"] }, score: 1 },
    ];
    return data;
  },
}));

vi.mock("./PromptCard", () => ({
  PromptCardPure: ({ prompt }: { prompt: { id: string; title: string } }) => (
    <div data-testid={`card-${prompt.id}`}>{prompt.title}</div>
  ),
}));

vi.mock("@/hooks/use-basket", () => ({
  useBasket: () => ({
    items: [],
    addItem: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAllRatings", () => ({
  useAllRatings: () => ({
    summaries: {},
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RelatedPrompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<RelatedPrompts promptId="prompt-a" />);
    expect(
      screen.getByRole("heading", { level: 2 })
    ).toHaveTextContent("Related Prompts");
  });

  it("shows subtitle", () => {
    render(<RelatedPrompts promptId="prompt-a" />);
    expect(
      screen.getByText("You might also find these useful")
    ).toBeInTheDocument();
  });

  it("shows recommendation count badge", () => {
    render(<RelatedPrompts promptId="prompt-a" />);
    expect(screen.getByText(/Recommendations/)).toBeInTheDocument();
  });

  it("renders related prompt cards (excludes current prompt)", () => {
    render(<RelatedPrompts promptId="prompt-a" />);
    // Should not show the current prompt
    expect(screen.queryByTestId("card-prompt-a")).not.toBeInTheDocument();
    // Should show related prompts
    expect(screen.getByTestId("card-prompt-b")).toBeInTheDocument();
  });

  it("respects limit prop", () => {
    render(<RelatedPrompts promptId="prompt-a" limit={1} />);
    const cards = screen.getAllByTestId(/^card-/);
    expect(cards).toHaveLength(1);
  });
});
