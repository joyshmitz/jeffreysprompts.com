/**
 * Tests for useOnboarding hook — onboarding hint management
 */
import { renderHook, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { useOnboarding } from "./useOnboarding";

describe("useOnboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("starts with all hints visible", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.shouldShowHint("swipe-gestures")).toBe(true);
    expect(result.current.shouldShowHint("spotlight-search")).toBe(true);
    expect(result.current.shouldShowHint("keyboard-shortcuts")).toBe(true);
  });

  it("starts with firstVisit true", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstVisit).toBe(true);
  });

  it("dismisses a specific hint", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.dismissHint("swipe-gestures");
    });

    expect(result.current.shouldShowHint("swipe-gestures")).toBe(false);
    // Other hints still visible
    expect(result.current.shouldShowHint("spotlight-search")).toBe(true);
  });

  it("persists dismissed hint to localStorage", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.dismissHint("double-tap");
    });

    // Flush debounce (debounceMs: 0 but still might need a tick)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    const stored = localStorage.getItem("jfp-onboarding");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.hints["double-tap"].dismissed).toBe(true);
  });

  it("resets a specific hint", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.dismissHint("filters");
    });
    expect(result.current.shouldShowHint("filters")).toBe(false);

    act(() => {
      result.current.resetHint("filters");
    });
    expect(result.current.shouldShowHint("filters")).toBe(true);
  });

  it("resets all hints", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.dismissHint("swipe-gestures");
      result.current.dismissHint("basket");
      result.current.dismissHint("filters");
    });

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.shouldShowHint("swipe-gestures")).toBe(true);
    expect(result.current.shouldShowHint("basket")).toBe(true);
    expect(result.current.shouldShowHint("filters")).toBe(true);
  });

  it("completes first visit", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isFirstVisit).toBe(true);

    act(() => {
      result.current.completeFirstVisit();
    });

    expect(result.current.isFirstVisit).toBe(false);
  });

  it("provides hint states record", () => {
    const { result } = renderHook(() => useOnboarding());
    const states = result.current.hintStates;
    expect(states).toHaveProperty("swipe-gestures");
    expect(states).toHaveProperty("spotlight-search");
    expect(states["swipe-gestures"].dismissed).toBe(false);
  });

  it("dismissed hint state has dismissedAt timestamp", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.dismissHint("theme-toggle");
    });

    expect(result.current.hintStates["theme-toggle"].dismissed).toBe(true);
    expect(result.current.hintStates["theme-toggle"].dismissedAt).not.toBeNull();
  });

  it("loads persisted state from localStorage", () => {
    // Pre-populate localStorage
    const state = {
      hints: {
        "swipe-gestures": { dismissed: true, dismissedAt: "2026-01-01T00:00:00Z" },
        "double-tap": { dismissed: false, dismissedAt: null },
        "long-press": { dismissed: false, dismissedAt: null },
        "spotlight-search": { dismissed: false, dismissedAt: null },
        "keyboard-shortcuts": { dismissed: false, dismissedAt: null },
        "filters": { dismissed: false, dismissedAt: null },
        "basket": { dismissed: false, dismissedAt: null },
        "theme-toggle": { dismissed: false, dismissedAt: null },
      },
      firstVisit: false,
      firstVisitAt: "2026-01-01T00:00:00Z",
    };
    localStorage.setItem("jfp-onboarding", JSON.stringify(state));

    const { result } = renderHook(() => useOnboarding());

    // Allow effects to run
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.shouldShowHint("swipe-gestures")).toBe(false);
    expect(result.current.shouldShowHint("double-tap")).toBe(true);
    expect(result.current.isFirstVisit).toBe(false);
  });
});
