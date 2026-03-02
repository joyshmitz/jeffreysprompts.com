/**
 * Unit tests for useLeaderboard hook
 * @module hooks/useLeaderboard.test
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLeaderboard } from "./useLeaderboard";
import {
  setFetchMock,
  mockFetchSuccess,
  mockFetchError,
  mockFetchPending,
  fixtures,
} from "@/test-utils/fetch-fixtures";

const { leaderboardEntries, leaderboardResponse } = fixtures;

describe("useLeaderboard", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("starts with loading state and empty entries", () => {
    setFetchMock(mockFetchPending());
    const { result } = renderHook(() => useLeaderboard());
    expect(result.current.loading).toBe(true);
    expect(result.current.entries).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("fetches leaderboard on mount", async () => {
    const fetchMock = mockFetchSuccess(leaderboardResponse);
    setFetchMock(fetchMock);

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toEqual(leaderboardEntries);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("passes default limit and minVotes params", async () => {
    const fetchMock = mockFetchSuccess({ entries: [], generated_at: "" });
    setFetchMock(fetchMock);

    renderHook(() => useLeaderboard());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("limit=10");
    expect(url).toContain("minVotes=1");
  });

  it("passes custom limit and minVotes", async () => {
    const fetchMock = mockFetchSuccess({ entries: [], generated_at: "" });
    setFetchMock(fetchMock);

    renderHook(() => useLeaderboard({ limit: 5, minVotes: 3 }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("limit=5");
    expect(url).toContain("minVotes=3");
  });

  it("sets error on fetch failure", async () => {
    setFetchMock(mockFetchError());

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch leaderboard");
    expect(result.current.entries).toEqual([]);
  });

  it("handles network error", async () => {
    setFetchMock(vi.fn().mockRejectedValue(new Error("Network down")));

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network down");
  });

  it("preserves previous entries on error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(leaderboardResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Oops" }),
      });
    setFetchMock(fetchMock);

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual(leaderboardEntries);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.entries).toEqual(leaderboardEntries);
    expect(result.current.error).toBe("Failed to fetch leaderboard");
  });

  it("refresh triggers a new fetch", async () => {
    const fetchMock = mockFetchSuccess(leaderboardResponse);
    setFetchMock(fetchMock);

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
