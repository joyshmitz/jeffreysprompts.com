/**
 * Tests for usePWAInstall hook — PWA installation prompt management
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { usePWAInstall } from "./usePWAInstall";

describe("usePWAInstall", () => {
  it("returns initial state with no install prompt", () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canPrompt).toBe(false);
    expect(typeof result.current.promptInstall).toBe("function");
  });

  it("detects iOS user agent", () => {
    const origUA = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      configurable: true,
    });
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isIOS).toBe(true);
    Object.defineProperty(navigator, "userAgent", {
      value: origUA,
      configurable: true,
    });
  });

  it("detects standalone display mode as installed", () => {
    const origMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
    window.matchMedia = origMatchMedia;
  });

  it("becomes installable when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);
    expect(result.current.canPrompt).toBe(true);
  });

  it("marks as installed when appinstalled fires", () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.canPrompt).toBe(false);
  });

  it("promptInstall returns dismissed when no deferred prompt", async () => {
    const { result } = renderHook(() => usePWAInstall());
    const outcome = await result.current.promptInstall();
    expect(outcome.outcome).toBe("dismissed");
    expect(outcome.reason).toBe("no-prompt");
  });

  it("promptInstall calls the deferred prompt", async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });

    const { result } = renderHook(() => usePWAInstall());

    // Simulate beforeinstallprompt with a mock event
    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, { prompt: mockPrompt, userChoice: mockUserChoice });
      window.dispatchEvent(event);
    });

    expect(result.current.canPrompt).toBe(true);

    let outcome: { outcome: string; reason: string | null };
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(outcome!.outcome).toBe("accepted");
    expect(outcome!.reason).toBeNull();
    // After acceptance, canPrompt should be false
    expect(result.current.canPrompt).toBe(false);
  });

  it("cleans up event listeners on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => usePWAInstall());

    expect(addSpy).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("appinstalled", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("appinstalled", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
