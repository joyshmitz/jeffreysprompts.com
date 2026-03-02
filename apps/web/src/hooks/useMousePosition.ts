"use client";

import { useCallback, useRef } from "react";
import { useMotionValue } from "framer-motion";

/**
 * useMousePosition - Hook to track mouse position relative to an element.
 *
 * Uses refs internally to avoid re-renders on every mousemove.
 * Exposes motion values for reactive CSS (useMotionTemplate) and
 * a ref-based getter for imperative reads.
 */
export function useMousePosition() {
  const positionRef = useRef({ x: 0, y: 0, percentageX: 50, percentageY: 50 });
  const elementRectRef = useRef<{
    target: EventTarget | null;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const motionPercentageX = useMotionValue(50);
  const motionPercentageY = useMotionValue(50);

  const cacheElementRect = useCallback((element: HTMLElement | null) => {
    if (!element) {
      elementRectRef.current = null;
      return;
    }

    const rect = element.getBoundingClientRect();
    elementRectRef.current = {
      target: element,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    let rect = elementRectRef.current;
    if (!rect || rect.target !== e.currentTarget) {
      const nextRect = e.currentTarget.getBoundingClientRect();
      rect = {
        target: e.currentTarget,
        left: nextRect.left,
        top: nextRect.top,
        width: nextRect.width,
        height: nextRect.height,
      };
      elementRectRef.current = rect;
    }

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const percentageX = (x / rect.width) * 100;
    const percentageY = (y / rect.height) * 100;

    positionRef.current = { x, y, percentageX, percentageY };
    motionPercentageX.set(percentageX);
    motionPercentageY.set(percentageY);
  }, [motionPercentageX, motionPercentageY]);

  const resetMousePosition = useCallback(() => {
    positionRef.current = { x: 0, y: 0, percentageX: 50, percentageY: 50 };
    elementRectRef.current = null;
    motionPercentageX.set(50);
    motionPercentageY.set(50);
  }, [motionPercentageX, motionPercentageY]);

  return {
    positionRef,
    motionPercentageX,
    motionPercentageY,
    cacheElementRect,
    handleMouseMove,
    resetMousePosition,
  };
}
