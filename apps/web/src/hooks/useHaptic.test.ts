/**
 * Tests for useHaptic hook — haptic feedback patterns
 */
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useHaptic } from "./useHaptic";

describe("useHaptic", () => {
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

  it("reports isSupported when vibrate API exists", () => {
    const { result } = renderHook(() => useHaptic());
    expect(result.current.isSupported).toBe(true);
  });

  it("reports isEnabled when enabled and supported", () => {
    const { result } = renderHook(() => useHaptic());
    expect(result.current.isEnabled).toBe(true);
  });

  it("disables when enabled option is false", () => {
    const { result } = renderHook(() => useHaptic({ enabled: false }));
    expect(result.current.isEnabled).toBe(false);
  });

  it("trigger calls navigator.vibrate with correct pattern", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.trigger("light"); });
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("trigger uses medium pattern (20ms)", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.trigger("medium"); });
    expect(vibrateMock).toHaveBeenCalledWith(20);
  });

  it("trigger uses heavy pattern (30ms)", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.trigger("heavy"); });
    expect(vibrateMock).toHaveBeenCalledWith(30);
  });

  it("trigger uses success pattern (compound)", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.trigger("success"); });
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 20]);
  });

  it("trigger uses error pattern (compound)", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.trigger("error"); });
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30, 50, 30]);
  });

  it("does not vibrate when disabled", () => {
    const { result } = renderHook(() => useHaptic({ enabled: false }));
    act(() => { result.current.trigger("light"); });
    expect(vibrateMock).not.toHaveBeenCalled();
  });

  it("convenience methods call trigger with correct pattern", () => {
    const { result } = renderHook(() => useHaptic());

    act(() => { result.current.light(); });
    expect(vibrateMock).toHaveBeenCalledWith(10);
    vibrateMock.mockClear();

    act(() => { result.current.medium(); });
    expect(vibrateMock).toHaveBeenCalledWith(20);
    vibrateMock.mockClear();

    act(() => { result.current.success(); });
    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 20]);
    vibrateMock.mockClear();

    act(() => { result.current.impact(); });
    expect(vibrateMock).toHaveBeenCalledWith(40);
  });

  it("selection convenience method", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.selection(); });
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it("swipe convenience method", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.swipe(); });
    expect(vibrateMock).toHaveBeenCalledWith([10, 30, 10]);
  });

  it("dragThreshold convenience method", () => {
    const { result } = renderHook(() => useHaptic());
    act(() => { result.current.dragThreshold(); });
    expect(vibrateMock).toHaveBeenCalledWith(25);
  });

  it("does not vibrate when not supported", () => {
    // Delete the property entirely so "vibrate" in navigator returns false
    // @ts-expect-error - deleting for test purposes
    delete navigator.vibrate;
    const { result } = renderHook(() => useHaptic());
    expect(result.current.isSupported).toBe(false);
    // Trigger should not throw
    act(() => { result.current.trigger("light"); });
  });
});
