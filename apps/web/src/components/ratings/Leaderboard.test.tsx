import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Leaderboard } from "./Leaderboard";
import { fixtures } from "@/test-utils/fetch-fixtures";

vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

vi.mock("@/hooks/useLeaderboard", () => ({
  useLeaderboard: vi.fn(() => ({ entries: [], loading: true, error: null })),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { useLeaderboard } from "@/hooks/useLeaderboard";

const mockEntries = [
  {
    prompt: { id: fixtures.leaderboardEntries[0].prompt.id, title: fixtures.leaderboardEntries[0].prompt.title, category: "ideation" },
    rating: { approvalRate: fixtures.leaderboardEntries[0].rating.approvalRate, total: fixtures.leaderboardEntries[0].rating.total },
  },
  {
    prompt: { id: fixtures.leaderboardEntries[1].prompt.id, title: fixtures.leaderboardEntries[1].prompt.title, category: "code-review" },
    rating: { approvalRate: fixtures.leaderboardEntries[1].rating.approvalRate, total: fixtures.leaderboardEntries[1].rating.total },
  },
  {
    prompt: { id: "bug-report-template", title: "Bug Report Template", category: "debugging" },
    rating: { approvalRate: 82, total: 100 },
  },
];

describe("Leaderboard", () => {
  beforeEach(() => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: [],
      loading: true,
      error: null,
      refresh: vi.fn(),
    });
  });

  it("shows skeleton when loading", () => {
    render(<Leaderboard />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("shows error message on error", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: [],
      loading: false,
      error: "fail",
      refresh: vi.fn(),
    });
    render(<Leaderboard />);
    expect(screen.getByText("Failed to load leaderboard")).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<Leaderboard />);
    expect(
      screen.getByText("No rated prompts yet. Be the first to rate!")
    ).toBeInTheDocument();
  });

  it("renders entries with titles and approval rates", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: mockEntries as never[],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    render(<Leaderboard />);
    expect(screen.getByText(fixtures.leaderboardEntries[0].prompt.title)).toBeInTheDocument();
    expect(screen.getByText(fixtures.leaderboardEntries[1].prompt.title)).toBeInTheDocument();
    expect(screen.getByText("Bug Report Template")).toBeInTheDocument();
    expect(screen.getByText(`${fixtures.leaderboardEntries[0].rating.approvalRate}%`)).toBeInTheDocument();
    expect(screen.getByText(`${fixtures.leaderboardEntries[1].rating.approvalRate}%`)).toBeInTheDocument();
  });

  it("calls onPromptClick when entry is clicked", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: mockEntries as never[],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    const onClick = vi.fn();
    render(<Leaderboard onPromptClick={onClick} />);
    fireEvent.click(screen.getByText(fixtures.leaderboardEntries[0].prompt.title));
    expect(onClick).toHaveBeenCalledWith(mockEntries[0].prompt);
  });

  it("applies className", () => {
    vi.mocked(useLeaderboard).mockReturnValue({
      entries: mockEntries as never[],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    const { container } = render(<Leaderboard className="my-class" />);
    expect(container.firstElementChild?.className).toContain("my-class");
  });
});
