/**
 * Unit tests for useRating hook
 * @module hooks/use-rating.test
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRating } from "./use-rating";
import {
  setFetchMock,
  mockFetchSuccess,
  mockFetchError,
  mockFetchPending,
  fixtures,
} from "@/test-utils/fetch-fixtures";

const { ratingSummary, ratingGetResponse, ratingPostResponse } = fixtures;

describe("useRating", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("starts with loading state", () => {
    setFetchMock(mockFetchPending());
    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.summary).toBeNull();
    expect(result.current.userRating).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("fetches rating on mount", async () => {
    const fetchMock = mockFetchSuccess({ ...ratingGetResponse, userRating: "up" });
    setFetchMock(fetchMock);

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary).toEqual(ratingSummary);
    expect(result.current.userRating).toBe("up");
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain("/api/ratings?");
    expect(fetchMock.mock.calls[0][0]).toContain("contentType=prompt");
    expect(fetchMock.mock.calls[0][0]).toContain("contentId=idea-wizard");
  });

  it("sets error on fetch failure", async () => {
    setFetchMock(mockFetchError(500, { error: "Server error" }));

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch rating");
  });

  it("handles network error", async () => {
    setFetchMock(vi.fn().mockRejectedValue(new Error("Network failure")));

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network failure");
  });

  it("submits a rating via rate()", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ratingGetResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ratingPostResponse),
      });
    setFetchMock(fetchMock);

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rate("up");
    });

    expect(result.current.userRating).toBe("up");
    expect(result.current.summary?.upvotes).toBe(6);
    expect(result.current.error).toBeNull();

    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toBe("/api/ratings");
    expect(postCall[1].method).toBe("POST");
  });

  it("sets error when rate() fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ratingGetResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Already rated" }),
      });
    setFetchMock(fetchMock);

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rate("up");
    });

    expect(result.current.error).toBe("Already rated");
  });

  it("preserves previous state on rate() error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...ratingGetResponse, userRating: "up" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Oops" }),
      });
    setFetchMock(fetchMock);

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rate("down");
    });

    expect(result.current.summary).toEqual(ratingSummary);
    expect(result.current.userRating).toBe("up");
    expect(result.current.error).toBe("Oops");
  });

  it("refresh triggers new fetch", async () => {
    const fetchMock = mockFetchSuccess(ratingGetResponse);
    setFetchMock(fetchMock);

    const { result } = renderHook(() =>
      useRating({ contentType: "prompt", contentId: "idea-wizard" })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
