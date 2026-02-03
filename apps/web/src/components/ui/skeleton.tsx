"use client"

import type { HTMLAttributes, ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the sweep variant for a more premium shimmer effect */
  variant?: "default" | "sweep" | "pulse"
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        variant === "default" && "animate-shimmer",
        variant === "sweep" && "skeleton-shimmer",
        variant === "pulse" && "skeleton animate-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

function SkeletonText({
  className,
  lines = 3,
  ...props
}: HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && "w-3/4" // Last line is shorter
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

function SkeletonAvatar({
  className,
  size = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  }

  return (
    <Skeleton
      className={cn(
        "rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

function SkeletonButton({
  className,
  size = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "default" | "lg"
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32",
  }

  return (
    <Skeleton
      className={cn(
        "rounded-lg",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

function SkeletonInput({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

/**
 * SkeletonContainer - Wrapper that cross-fades between skeleton and content
 *
 * Usage:
 * ```tsx
 * <SkeletonContainer
 *   isLoading={isLoading}
 *   skeleton={<SkeletonCard />}
 * >
 *   <ActualContent />
 * </SkeletonContainer>
 * ```
 */
interface SkeletonContainerProps {
  /** Whether to show the skeleton or the children */
  isLoading: boolean
  /** The skeleton placeholder to show while loading */
  skeleton: ReactNode
  /** The actual content to show when loaded */
  children: ReactNode
  /** Additional class names for the container */
  className?: string
  /** Animation duration in ms (default: 300) */
  duration?: number
}

function SkeletonContainer({
  isLoading,
  skeleton,
  children,
  className,
  duration = 300,
}: SkeletonContainerProps) {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const transitionDuration = prefersReducedMotion ? 0 : duration / 1000

  return (
    <div className={cn("relative", className)} aria-busy={isLoading} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * SkeletonFade - Simple fade-in wrapper for content that was loading
 *
 * Usage:
 * ```tsx
 * {isLoading ? <Skeleton /> : <SkeletonFade><Content /></SkeletonFade>}
 * ```
 */
interface SkeletonFadeProps {
  children: ReactNode
  className?: string
  /** Animation duration in ms (default: 300) */
  duration?: number
}

function SkeletonFade({
  children,
  className,
  duration = 300,
}: SkeletonFadeProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  return (
    <motion.div
      className={className}
      initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : duration / 1000 }}
    >
      {children}
    </motion.div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonContainer,
  SkeletonFade,
}
