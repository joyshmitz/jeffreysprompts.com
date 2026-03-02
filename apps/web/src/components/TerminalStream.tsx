"use client";

import { useReducedMotion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface TerminalStreamProps {
  text: string;
  className?: string;
}

/**
 * TerminalStream - Hyper-optimized code preview with streaming effect.
 * 
 * Features:
 * - Mimics a real AI agent typing/streaming
 * - Uses character-by-character reveal
 * - Performance optimized: directly mutates DOM to bypass React render cycle during animation
 * - Performance optimized: only animates when in view
 */
export function TerminalStream({ text, className }: TerminalStreamProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLParagraphElement>(null);
  const textNodeRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "100px" });

  const setCursorActive = (active: boolean) => {
    if (!cursorRef.current) return;
    cursorRef.current.style.opacity = active ? "1" : "0";
    cursorRef.current.style.animationPlayState = active ? "running" : "paused";
  };

  useEffect(() => {
    if (textNodeRef.current) {
      textNodeRef.current.textContent = "";
    }
    setCursorActive(!prefersReducedMotion);
  }, [text, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (textNodeRef.current) {
        textNodeRef.current.textContent = text;
      }
      setCursorActive(false);
      return;
    }

    if (!isInView) {
      return;
    }

    let currentIndex = 0;
    let lastTime = 0;
    const charsPerSecond = 150; // High-speed agent feel
    let frameId: number;

    const stream = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed > 1000 / (charsPerSecond / 3)) {
        currentIndex += 3;
        
        // Direct DOM mutation - bypasses React render cycle entirely for 60fps performance
        if (textNodeRef.current) {
          textNodeRef.current.textContent = text.slice(0, currentIndex);
        }
        lastTime = timestamp;
      }

      if (currentIndex < text.length) {
        frameId = requestAnimationFrame(stream);
      } else {
        setCursorActive(false);
      }
    };

    frameId = requestAnimationFrame(stream);

    return () => cancelAnimationFrame(frameId);
  }, [text, prefersReducedMotion, isInView]);

  return (
    <p ref={containerRef} className={className}>
      <span ref={textNodeRef}></span>
      {!prefersReducedMotion && (
        <span
          ref={cursorRef}
          className="inline-block w-1.5 h-3 bg-indigo-500 ml-0.5 align-middle animate-pulse"
          style={{ opacity: 0, animationPlayState: "paused" }}
        />
      )}
    </p>
  );
}
