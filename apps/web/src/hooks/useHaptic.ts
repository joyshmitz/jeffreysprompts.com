"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Haptic feedback patterns for different interaction types.
 */
export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "selection"
  | "warning"
  | "impact"
  | "notification"
  | "drag_threshold"
  | "drag_complete"
  | "swipe"
  | "double_tap"
  | "long_press"
  | "pull_refresh";

interface HapticOptions {
  /** Whether haptic feedback is enabled (respects user preferences) */
  enabled?: boolean;
}

/**
 * Maps haptic patterns to vibration durations (in milliseconds).
 * These durations are tuned for a natural feel on mobile devices.
 *
 * Pattern design principles:
 * - light/selection: Subtle acknowledgment (10ms)
 * - medium: Standard feedback (20ms)
 * - heavy/impact: Emphasis or completion (30-40ms)
 * - Compound patterns use gaps to create rhythm
 */
const patternDurations: Record<HapticPattern, number | number[]> = {
  // Basic patterns
  light: 10,
  medium: 20,
  heavy: 30,
  selection: 10,

  // Feedback patterns
  success: [10, 50, 20], // Two quick taps (acknowledgment)
  error: [30, 50, 30, 50, 30], // Three warning taps
  warning: [20, 100, 20], // Double pulse warning
  notification: [15, 80, 15, 80, 15], // Triple gentle pulse

  // Interaction patterns
  impact: 40, // Strong single tap for impact moments
  swipe: [10, 30, 10], // Light feedback during swipe
  double_tap: [15, 40, 15], // Quick double pulse
  long_press: [10, 20, 30], // Building intensity

  // Gesture patterns
  drag_threshold: 25, // Feedback when crossing threshold
  drag_complete: [20, 40, 30], // Completion feedback
  pull_refresh: [10, 30, 15, 30, 20], // Progressive feedback
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
  const warning = useCallback(() => trigger("warning"), [trigger]);
  const impact = useCallback(() => trigger("impact"), [trigger]);
  const notification = useCallback(() => trigger("notification"), [trigger]);
  const dragThreshold = useCallback(() => trigger("drag_threshold"), [trigger]);
  const dragComplete = useCallback(() => trigger("drag_complete"), [trigger]);
  const swipe = useCallback(() => trigger("swipe"), [trigger]);
  const doubleTap = useCallback(() => trigger("double_tap"), [trigger]);
  const longPress = useCallback(() => trigger("long_press"), [trigger]);
  const pullRefresh = useCallback(() => trigger("pull_refresh"), [trigger]);

  return {
    /** Whether haptic feedback is supported on this device */
    isSupported,
    /** Whether haptic feedback is currently enabled */
    isEnabled: enabled && isSupported && !prefersReducedMotion,
    /** Trigger haptic feedback with a pattern */
    trigger,

    // Basic patterns
    /** Light tap feedback (10ms) */
    light,
    /** Medium tap feedback (20ms) */
    medium,
    /** Heavy tap feedback (30ms) */
    heavy,
    /** Selection feedback (10ms) */
    selection,

    // Feedback patterns
    /** Success pattern (two quick taps) */
    success,
    /** Error pattern (three warning taps) */
    error,
    /** Warning pattern (double pulse) */
    warning,
    /** Notification pattern (triple gentle pulse) */
    notification,

    // Interaction patterns
    /** Strong impact for emphasis (40ms) */
    impact,
    /** Swipe gesture feedback */
    swipe,
    /** Double-tap acknowledgment */
    doubleTap,
    /** Long-press building feedback */
    longPress,

    // Gesture patterns
    /** Feedback when crossing a drag threshold */
    dragThreshold,
    /** Completion feedback for drag */
    dragComplete,
    /** Pull-to-refresh progressive feedback */
    pullRefresh,
  };
}

export default useHaptic;
