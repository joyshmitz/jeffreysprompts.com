"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Haptic feedback patterns for different interaction types.
 */
export type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "selection";

interface HapticOptions {
  /** Whether haptic feedback is enabled (respects user preferences) */
  enabled?: boolean;
}

/**
 * Maps haptic patterns to vibration durations (in milliseconds).
 * These durations are tuned for a natural feel on mobile devices.
 */
const patternDurations: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20], // Two quick taps
  error: [30, 50, 30, 50, 30], // Three warning taps
  selection: 10,
};

/**
 * useHaptic - Hook for triggering haptic feedback on mobile devices.
 *
 * Uses the Vibration API where available, with graceful degradation.
 * Respects reduced motion preferences.
 *
 * @example
 * ```tsx
 * function CopyButton() {
 *   const haptic = useHaptic();
 *
 *   const handleCopy = () => {
 *     navigator.clipboard.writeText(text);
 *     haptic.trigger("success");
 *   };
 *
 *   return <button onClick={handleCopy}>Copy</button>;
 * }
 * ```
 */
export function useHaptic(options: HapticOptions = {}) {
  const { enabled = true } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for Vibration API support
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  /**
   * Trigger haptic feedback with the specified pattern.
   */
  const trigger = useCallback(
    (pattern: HapticPattern = "light") => {
      // Skip if not supported, disabled, or user prefers reduced motion
      if (!isSupported || !enabled || prefersReducedMotion) {
        return;
      }

      const duration = patternDurations[pattern];
      try {
        navigator.vibrate(duration);
      } catch {
        // Silently fail if vibration fails (e.g., permissions)
      }
    },
    [isSupported, enabled, prefersReducedMotion]
  );

  /**
   * Convenience methods for common patterns
   */
  const light = useCallback(() => trigger("light"), [trigger]);
  const medium = useCallback(() => trigger("medium"), [trigger]);
  const heavy = useCallback(() => trigger("heavy"), [trigger]);
  const success = useCallback(() => trigger("success"), [trigger]);
  const error = useCallback(() => trigger("error"), [trigger]);
  const selection = useCallback(() => trigger("selection"), [trigger]);

  return {
    /** Whether haptic feedback is supported on this device */
    isSupported,
    /** Whether haptic feedback is currently enabled */
    isEnabled: enabled && isSupported && !prefersReducedMotion,
    /** Trigger haptic feedback with a pattern */
    trigger,
    /** Light tap feedback (10ms) */
    light,
    /** Medium tap feedback (20ms) */
    medium,
    /** Heavy tap feedback (30ms) */
    heavy,
    /** Success pattern (two quick taps) */
    success,
    /** Error pattern (three warning taps) */
    error,
    /** Selection feedback (10ms) */
    selection,
  };
}

export default useHaptic;
