/**
 * Tests for useAnnounce and useAnnounceCount hooks
 */
import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { useAnnounce, useAnnounceCount } from "./useAnnounce";

// Mock the accessibility module
vi.mock("@/lib/accessibility", () => ({
  announceToScreenReader: vi.fn(),
  announceCount: vi.fn(),
}));

import { announceToScreenReader, announceCount } from "@/lib/accessibility";

describe("useAnnounce", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a function", () => {
    const { result } = renderHook(() => useAnnounce());
    expect(typeof result.current).toBe("function");
  });

  it("calls announceToScreenReader with message", () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current("Copied to clipboard");
    });
    expect(announceToScreenReader).toHaveBeenCalledWith("Copied to clipboard", "polite");
  });

  it("passes priority parameter", () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current("Error occurred", "assertive");
    });
    expect(announceToScreenReader).toHaveBeenCalledWith("Error occurred", "assertive");
  });

  it("defaults to polite priority", () => {
    const { result } = renderHook(() => useAnnounce());
    act(() => {
      result.current("Hello");
    });
    expect(announceToScreenReader).toHaveBeenCalledWith("Hello", "polite");
  });

  it("returns stable reference", () => {
    const { result, rerender } = renderHook(() => useAnnounce());
    const ref1 = result.current;
    rerender();
    expect(result.current).toBe(ref1);
  });
});

describe("useAnnounceCount", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a function", () => {
    const { result } = renderHook(() => useAnnounceCount());
    expect(typeof result.current).toBe("function");
  });

  it("calls announceCount with correct args", () => {
    const { result } = renderHook(() => useAnnounceCount());
    act(() => {
      result.current(5, "result", "results");
    });
    expect(announceCount).toHaveBeenCalledWith(5, "result", "results");
  });

  it("returns stable reference", () => {
    const { result, rerender } = renderHook(() => useAnnounceCount());
    const ref1 = result.current;
    rerender();
    expect(result.current).toBe(ref1);
  });
});
