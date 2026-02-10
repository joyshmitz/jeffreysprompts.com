/**
 * Tests for usePrecisionHaptic hook — precision haptic feedback
 */
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { usePrecisionHaptic } from "./usePrecisionHaptic";

describe("usePrecisionHaptic", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;
  let originalVibrate: Navigator["vibrate"] | undefined;

  beforeEach(() => {
    vibrateMock = vi.fn().mockReturnValue(true);
    originalVibrate = navigator.vibrate;
    Object.defineProperty(navigator, "vibrate", {
      value: vibrateMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalVibrate !== undefined) {
      Object.defineProperty(navigator, "vibrate", {
        value: originalVibrate,
        configurable: true,
        writable: true,
      });
    }
  });

  it("returns light, medium, success, error, impact methods", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    expect(typeof result.current.light).toBe("function");
    expect(typeof result.current.medium).toBe("function");
    expect(typeof result.current.success).toBe("function");
    expect(typeof result.current.error).toBe("function");
    expect(typeof result.current.impact).toBe("function");
  });

  it("light triggers 10ms vibration", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    act(() => { result.current.light(); });
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("medium triggers 20ms vibration", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    act(() => { result.current.medium(); });
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it("success triggers compound pattern", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    act(() => { result.current.success(); });
    expect(vibrateMock).toHaveBeenCalledWith([10, 30, 10]);
  });

  it("error triggers compound pattern", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    act(() => { result.current.error(); });
    expect(vibrateMock).toHaveBeenCalledWith([50, 50, 50]);
  });

  it("impact triggers 40ms vibration", () => {
    const { result } = renderHook(() => usePrecisionHaptic());
    act(() => { result.current.impact(); });
    expect(vibrateMock).toHaveBeenCalledWith(40);
  });

  it("does not throw when vibrate API is unavailable", () => {
    // Delete the property entirely so "vibrate" in navigator returns false
    // @ts-expect-error - deleting for test purposes
    delete navigator.vibrate;
    const { result } = renderHook(() => usePrecisionHaptic());
    // Should not throw
    act(() => { result.current.light(); });
    act(() => { result.current.error(); });
  });
});
