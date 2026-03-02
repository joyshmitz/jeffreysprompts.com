"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * HeroBackground - A truly next-level, GPU-accelerated animated background.
 *
 * Design features:
 * - Layered mesh gradients with slow, organic movement
 * - Parallax effect based on scroll position
 * - Grainy texture overlay for premium depth
 * - Respects reduced motion settings
 * - Optimized for zero layout shift
 * - Uses CSS @keyframes instead of Framer Motion for infinite animations (compositor thread)
 */
export function HeroBackground() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- hydration safety pattern
  }, []);

  if (!mounted) return null;

  const animate = !prefersReducedMotion;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500" />

      {/* Animated Mesh Blobs - CSS @keyframes for compositor-thread animation */}
      {animate && (
        <>
          {/* Cyan Blob */}
          <div
            className="absolute -top-[10%] -left-[10%] w-[50%] h-[60%] rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen will-change-transform"
            style={{ animation: "hero-blob-cyan 25s ease-in-out infinite" }}
          />

          {/* Amber Blob */}
          <div
            className="absolute top-[20%] -right-[10%] w-[45%] h-[55%] rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen will-change-transform"
            style={{ animation: "hero-blob-amber 30s ease-in-out 1s infinite" }}
          />

          {/* Purple Blob */}
          <div
            className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-500/10 blur-[140px] mix-blend-multiply dark:mix-blend-screen will-change-transform"
            style={{ animation: "hero-blob-purple 22s ease-in-out 2s infinite" }}
          />
        </>
      )}

      {/* Static gradient for consistency if motion is reduced or disabled */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-neutral-950/50 dark:to-neutral-950" />

      {/* Grainy texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="hero-noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-noise-filter)" />
        </svg>
      </div>

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.1] dark:opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "40px 40px",
          color: "rgba(0,0,0,0.1)",
        }}
      />
      <div className="dark:block hidden absolute inset-0"
           style={{
             backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
             backgroundSize: "40px 40px",
           }}
      />
    </div>
  );
}

export default HeroBackground;
