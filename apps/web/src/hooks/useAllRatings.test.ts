/**
 * Tests for useAllRatings hook — bulk rating fetching
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useAllRatings } from "./useAllRatings";
import {
  setFetchMock,
  mockFetchSuccess,
  mockFetchNetworkError,
  fixtures,
} from "@/test-utils/fetch-fixtures";

const { allRatingsSummaries, allRatingsResponse } = fixtures;

describe("useAllRatings", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("starts in loading state", () => {
    setFetchMock(vi.fn().mockImplementation(() => new Promise(() => {})));
    const { result } = renderHook(() => useAllRatings());
    expect(result.current.loading).toBe(true);
    expect(result.current.summaries).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it("fetches ratings on mount", async () => {
    const fetchMock = mockFetchSuccess(allRatingsResponse);
    setFetchMock(fetchMock);

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.summaries).toEqual(allRatingsSummaries);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBe("2026-01-15T00:00:00Z");
  });

  it("calls correct API endpoint", async () => {
    const fetchMock = mockFetchSuccess({ summaries: {}, generated_at: "" });
    setFetchMock(fetchMock);

    renderHook(() => useAllRatings());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[0][0]).toBe("/api/ratings/summaries");
  });

  it("handles fetch error", async () => {
    setFetchMock(vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch ratings");
  });

  it("handles network error", async () => {
    setFetchMock(mockFetchNetworkError("Network error"));

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
  });

  it("getRating returns summary for known content", async () => {
    setFetchMock(mockFetchSuccess(allRatingsResponse));

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getRating("idea-wizard")).toEqual(allRatingsSummaries["idea-wizard"]);
  });

  it("getRating returns null for unknown content", async () => {
    setFetchMock(mockFetchSuccess(allRatingsResponse));

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getRating("nonexistent")).toBeNull();
  });

  it("refresh triggers a new fetch", async () => {
    const fetchMock = mockFetchSuccess(allRatingsResponse);
    setFetchMock(fetchMock);

    const { result } = renderHook(() => useAllRatings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
