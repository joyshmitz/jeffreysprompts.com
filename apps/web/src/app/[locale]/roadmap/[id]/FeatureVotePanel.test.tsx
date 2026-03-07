import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeatureVotePanel } from "./FeatureVotePanel";

const mockToastError = vi.fn();

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ error: mockToastError }),
}));

describe("FeatureVotePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("submits a vote and updates the count", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, voteCount: 43 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <FeatureVotePanel
        featureId="feat-002"
        initialVoteCount={42}
        initialHasVoted={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Vote for this feature" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/roadmap/feat-002/vote", {
        method: "POST",
      });
      expect(screen.getByText("43")).toBeInTheDocument();
    });
  });

  it("removes an existing vote and updates the count", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, voteCount: 41 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <FeatureVotePanel
        featureId="feat-002"
        initialVoteCount={42}
        initialHasVoted={true}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove vote" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/roadmap/feat-002/vote", {
        method: "DELETE",
      });
      expect(screen.getByText("41")).toBeInTheDocument();
    });
  });

  it("shows a toast error when the vote request fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Already voted" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <FeatureVotePanel
        featureId="feat-002"
        initialVoteCount={42}
        initialHasVoted={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Vote for this feature" }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Vote failed", "Already voted");
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });
});
