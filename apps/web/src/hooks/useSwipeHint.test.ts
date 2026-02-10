/**
 * Tests for useSwipeHint hook — one-time swipe hint management
 */
import { renderHook, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { useSwipeHint } from "./useSwipeHint";

describe("useSwipeHint", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("shows hint by default", () => {
    const { result } = renderHook(() => useSwipeHint());
    expect(result.current.showHint).toBe(true);
  });

  it("hides hint after dismissal", () => {
    const { result } = renderHook(() => useSwipeHint());

    act(() => {
      result.current.dismissHint();
    });

    expect(result.current.showHint).toBe(false);
  });

  it("persists dismissal to localStorage", () => {
    const { result } = renderHook(() => useSwipeHint());

    act(() => {
      result.current.dismissHint();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    const stored = localStorage.getItem("jfp-swipe-hint-dismissed");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toBe(true);
  });

  it("loads dismissed state from localStorage", () => {
    localStorage.setItem("jfp-swipe-hint-dismissed", JSON.stringify(true));

    const { result } = renderHook(() => useSwipeHint());

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.showHint).toBe(false);
  });

  it("resets hint to show again", () => {
    const { result } = renderHook(() => useSwipeHint());

    act(() => {
      result.current.dismissHint();
    });
    expect(result.current.showHint).toBe(false);

    act(() => {
      result.current.resetHint();
    });
    expect(result.current.showHint).toBe(true);
  });
});
