"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  /** Target number to count up to */
  value: number;
  /** Duration of the animation in seconds */
  duration?: number;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Format function for the number */
  formatValue?: (value: number) => string;
  /** Additional className */
  className?: string;
  /** Whether to trigger animation only once */
  once?: boolean;
  /** Threshold for viewport intersection */
  threshold?: number;
  /** Prefix to display before the number */
  prefix?: string;
  /** Suffix to display after the number */
  suffix?: string;
}

/**
 * AnimatedCounter - Count-up animation component.
 *
 * Features:
 * - Viewport-triggered animation
 * - Smooth spring-based motion
 * - Configurable formatting
 * - Respects reduced motion preferences
 *
 * @example
 * ```tsx
 * <AnimatedCounter
 *   value={150}
 *   suffix="+"
 *   className="text-3xl font-bold"
 * />
 * ```
 */
export function AnimatedCounter({
  value,
  duration = 1.5,
  delay = 0,
  formatValue = (v) => Math.round(v).toLocaleString(),
  className,
  once = true,
  threshold = 0.3,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Spring animation for smooth counting
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  // Transform to the display value
  const displayValue = useTransform(springValue, (latest) =>
    formatValue(latest)
  );

  // Track current displayed value for static rendering
  const [currentDisplay, setCurrentDisplay] = useState(formatValue(0));

  useEffect(() => {
    // Subscribe to value changes
    const unsubscribe = displayValue.on("change", (latest) => {
      setCurrentDisplay(latest);
    });
    return unsubscribe;
  }, [displayValue]);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  useEffect(() => {
    if (isInView && !hasAnimated) {
      // If reduced motion is preferred, skip animation and show final value
      if (prefersReducedMotion) {
        springValue.set(value);
        setHasAnimated(true);
        return;
      }

      // Small delay then animate
      const timer = setTimeout(() => {
        springValue.set(value);
        setHasAnimated(true);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay, springValue, hasAnimated, prefersReducedMotion]);

  // Always render the same structure to avoid hydration mismatch
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{currentDisplay}</motion.span>
      {suffix}
    </span>
  );
}

/**
 * Simplified counter for text values like "Free"
 */
export function AnimatedText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 10, filter: "blur(4px)" }
      }
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {text}
    </motion.span>
  );
}

export default AnimatedCounter;
