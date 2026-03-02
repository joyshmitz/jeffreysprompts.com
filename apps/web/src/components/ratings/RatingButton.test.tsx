import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RatingButton } from "./RatingButton";
import {
  setFetchMock,
  mockFetchSuccess,
  fixtures,
} from "@/test-utils/fetch-fixtures";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

const { ratingGetResponse, ratingSummary } = fixtures;

describe("RatingButton", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("renders upvote and downvote buttons", async () => {
    setFetchMock(mockFetchSuccess(ratingGetResponse));
    render(<RatingButton contentType="prompt" contentId="idea-wizard" />);

    await waitFor(() => expect(screen.getByLabelText("Upvote")).toBeEnabled());

    expect(screen.getByLabelText("Upvote")).toBeInTheDocument();
    expect(screen.getByLabelText("Downvote")).toBeInTheDocument();
  });

  it("displays vote counts when showCount is true", async () => {
    setFetchMock(mockFetchSuccess(ratingGetResponse));
    render(<RatingButton contentType="prompt" contentId="idea-wizard" showCount />);

    await waitFor(() => expect(screen.getByLabelText("Upvote")).toBeEnabled());

    expect(screen.getByText(String(ratingSummary.upvotes))).toBeInTheDocument();
    expect(screen.getByText(String(ratingSummary.downvotes))).toBeInTheDocument();
  });

  it("calls rate function when upvote is clicked", async () => {
    const fetchMock = mockFetchSuccess(ratingGetResponse);
    setFetchMock(fetchMock);
    render(<RatingButton contentType="prompt" contentId="idea-wizard" />);

    await waitFor(() => expect(screen.getByLabelText("Upvote")).toBeEnabled());

    fireEvent.click(screen.getByLabelText("Upvote"));

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === "POST"
      );
      expect(postCalls).toHaveLength(1);
      const body = JSON.parse((postCalls[0][1] as RequestInit).body as string);
      expect(body.value).toBe("up");
    });
  });

  it("calls rate function when downvote is clicked", async () => {
    const fetchMock = mockFetchSuccess(ratingGetResponse);
    setFetchMock(fetchMock);
    render(<RatingButton contentType="prompt" contentId="idea-wizard" />);

    await waitFor(() => expect(screen.getByLabelText("Downvote")).toBeEnabled());

    fireEvent.click(screen.getByLabelText("Downvote"));

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        (c: unknown[]) => (c[1] as RequestInit | undefined)?.method === "POST"
      );
      expect(postCalls).toHaveLength(1);
      const body = JSON.parse((postCalls[0][1] as RequestInit).body as string);
      expect(body.value).toBe("down");
    });
  });

  it("applies correct size class for sm variant", async () => {
    setFetchMock(mockFetchSuccess(ratingGetResponse));
    render(<RatingButton contentType="prompt" contentId="idea-wizard" size="sm" />);

    await waitFor(() => expect(screen.getByLabelText("Upvote")).toBeEnabled());

    const upvoteButton = screen.getByLabelText("Upvote");
    expect(upvoteButton).toHaveClass("h-8", "w-8");
  });
});
