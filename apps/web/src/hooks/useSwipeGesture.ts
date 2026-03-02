"use client";

import { useRef, useCallback, useState } from "react";
import { useMotionValue, MotionValue } from "framer-motion";

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

interface SwipeState {
  /** Whether a swipe is currently in progress */
  isSwiping: boolean;
  /** Current horizontal displacement */
  deltaX: MotionValue<number>;
  /** Current vertical displacement */
  deltaY: MotionValue<number>;
  /** Detected swipe direction (null if not determined) */
  direction: SwipeDirection;
  /** Swipe velocity (pixels per millisecond) */
  velocity: number;
}

interface SwipeConfig {
  /** Minimum distance to trigger a swipe (default: 50) */
  threshold?: number;
  /** Velocity threshold for quick swipes (default: 0.5) */
  velocityThreshold?: number;
  /** Lock to horizontal or vertical axis (default: horizontal) */
  axis?: "horizontal" | "vertical" | "both";
  /** Prevent default touch behavior */
  preventDefault?: boolean;
}

interface SwipeHandlers {
  onSwipeStart?: () => void;
  onSwipeMove?: (state: SwipeState) => void;
  onSwipeEnd?: (state: SwipeState) => void;
  onSwipeLeft?: (state: SwipeState) => void;
  onSwipeRight?: (state: SwipeState) => void;
  onSwipeUp?: (state: SwipeState) => void;
  onSwipeDown?: (state: SwipeState) => void;
}

/**
 * useSwipeGesture - Hook for detecting swipe gestures on touch devices.
 *
 * Features:
 * - Uses Framer Motion's useMotionValue to bypass React render cycle during drags
 * - Configurable swipe threshold and velocity
 * - Axis locking (horizontal, vertical, or both)
 * - Velocity-based dismissal
 */
export function useSwipeGesture(
  callbacks: SwipeHandlers = {},
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.5,
    axis = "horizontal",
    preventDefault = false,
  } = config;

  const deltaX = useMotionValue(0);
  const deltaY = useMotionValue(0);

  const [state, setState] = useState<Omit<SwipeState, "deltaX" | "deltaY">>({
    isSwiping: false,
    direction: null,
    velocity: 0,
  });

  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);
  const currentPos = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => {
    deltaX.set(0);
    deltaY.set(0);
    setState({
      isSwiping: false,
      direction: null,
      velocity: 0,
    });
  }, [deltaX, deltaY]);

  const calculateDirection = useCallback(
    (dX: number, dY: number): SwipeDirection => {
      const absX = Math.abs(dX);
      const absY = Math.abs(dY);

      if (axis === "horizontal" || (axis === "both" && absX > absY)) {
        if (absX < 10) return null;
        return dX > 0 ? "right" : "left";
      } else if (axis === "vertical" || (axis === "both" && absY > absX)) {
        if (absY < 10) return null;
        return dY > 0 ? "down" : "up";
      }
      return null;
    },
    [axis]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      currentPos.current = { x: touch.clientX, y: touch.clientY };
      startTime.current = Date.now();

      setState((prev) => ({ ...prev, isSwiping: true }));
      callbacks.onSwipeStart?.();
    },
    [callbacks]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (preventDefault) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      currentPos.current = { x: touch.clientX, y: touch.clientY };

      const dX = touch.clientX - startPos.current.x;
      const dY = touch.clientY - startPos.current.y;

      // Lock to axis
      let finalDeltaX = dX;
      let finalDeltaY = dY;

      if (axis === "horizontal") {
        finalDeltaY = 0;
      } else if (axis === "vertical") {
        finalDeltaX = 0;
      }

      // Update motion values directly to skip React renders
      deltaX.set(finalDeltaX);
      deltaY.set(finalDeltaY);

      const direction = calculateDirection(finalDeltaX, finalDeltaY);

      // Calculate velocity
      const elapsed = Date.now() - startTime.current;
      const distance = Math.sqrt(finalDeltaX ** 2 + finalDeltaY ** 2);
      const velocity = elapsed > 0 ? distance / elapsed : 0;

      // We don't call setState here during the drag to keep it smooth!
      const currentState: SwipeState = {
        isSwiping: true,
        deltaX,
        deltaY,
        direction,
        velocity,
      };

      callbacks.onSwipeMove?.(currentState);
    },
    [axis, calculateDirection, callbacks, preventDefault, deltaX, deltaY]
  );

  const handleTouchEnd = useCallback(() => {
    const dX = currentPos.current.x - startPos.current.x;
    const dY = currentPos.current.y - startPos.current.y;
    
    let finalDeltaX = dX;
    let finalDeltaY = dY;
    if (axis === "horizontal") finalDeltaY = 0;
    if (axis === "vertical") finalDeltaX = 0;

    const elapsed = Date.now() - startTime.current;
    const distance = Math.sqrt(finalDeltaX ** 2 + finalDeltaY ** 2);
    const velocity = elapsed > 0 ? distance / elapsed : 0;

    const direction = calculateDirection(finalDeltaX, finalDeltaY);

    const finalState: SwipeState = {
      isSwiping: false,
      deltaX,
      deltaY,
      direction,
      velocity,
    };

    callbacks.onSwipeEnd?.(finalState);

    // Check if swipe exceeds threshold
    const meetsThreshold =
      Math.abs(finalDeltaX) > threshold ||
      Math.abs(finalDeltaY) > threshold ||
      velocity > velocityThreshold;

    if (meetsThreshold && direction) {
      switch (direction) {
        case "left":
          callbacks.onSwipeLeft?.(finalState);
          break;
        case "right":
          callbacks.onSwipeRight?.(finalState);
          break;
        case "up":
          callbacks.onSwipeUp?.(finalState);
          break;
        case "down":
          callbacks.onSwipeDown?.(finalState);
          break;
      }
    }

    setState({
      isSwiping: false,
      direction: null,
      velocity: 0,
    });
  }, [axis, calculateDirection, callbacks, threshold, velocityThreshold, deltaX, deltaY]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    handlers,
    state: {
      ...state,
      deltaX,
      deltaY
    },
    reset,
  };
}

export default useSwipeGesture;
