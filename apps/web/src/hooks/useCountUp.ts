"use client";

import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  easing?: (t: number) => number;
  enabled?: boolean;
}

// Easing functions
const easings = {
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
};

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  decimals = 0,
  easing = easings.easeOutExpo,
  enabled = true,
}: UseCountUpOptions): number {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setCount(start);
      return;
    }

    const timeoutId = setTimeout(() => {
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        const currentCount = start + (end - start) * easedProgress;

        setCount(Number(currentCount.toFixed(decimals)));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [start, end, duration, delay, decimals, easing, enabled]);

  return count;
}

export { easings };
