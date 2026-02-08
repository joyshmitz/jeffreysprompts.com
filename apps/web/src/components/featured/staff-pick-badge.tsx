"use client";

/**
 * Featured Content Badges
 *
 * Displays badge indicators for staff picks, featured content, and spotlights.
 * Enhanced with premium animations and glows.
 */

import { Star, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeatureType } from "@/lib/featured/featured-store";

interface FeaturedBadgeProps {
  type: FeatureType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const BADGE_CONFIG: Record<
  FeatureType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colors: string;
    glow: string;
  }
> = {
  staff_pick: {
    label: "Staff Pick",
    icon: Star,
    colors: "bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  featured: {
    label: "Featured",
    icon: Sparkles,
    colors: "bg-indigo-100/50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]",
  },
  spotlight: {
    label: "Spotlight",
    icon: Award,
    colors: "bg-sky-100/50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    glow: "shadow-[0_0_15px_rgba(14,165,233,0.3)]",
  },
};

const SIZE_CLASSES = {
  sm: {
    wrapper: "px-2 py-0.5 text-[10px] gap-1",
    icon: "h-3 w-3",
  },
  md: {
    wrapper: "px-3 py-1 text-xs gap-1.5",
    icon: "h-3.5 w-3.5",
  },
  lg: {
    wrapper: "px-4 py-1.5 text-sm gap-2",
    icon: "h-4 w-4",
  },
};

export function FeaturedBadge({
  type,
  size = "md",
  showLabel = true,
  className,
}: FeaturedBadgeProps) {
  const config = BADGE_CONFIG[type];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold uppercase tracking-widest backdrop-blur-md transition-all",
        config.colors,
        config.glow,
        sizeClasses.wrapper,
        className
      )}
    >
      <Icon className={sizeClasses.icon} />
      {showLabel && <span>{config.label}</span>}
    </motion.span>
  );
}

export function StaffPickBadge({
  size = "md",
  showLabel = true,
  className,
}: Omit<FeaturedBadgeProps, "type">) {
  return (
    <FeaturedBadge
      type="staff_pick"
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

export function FeaturedContentBadge({
  size = "md",
  showLabel = true,
  className,
}: Omit<FeaturedBadgeProps, "type">) {
  return (
    <FeaturedBadge
      type="featured"
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

export function SpotlightBadge({
  size = "md",
  showLabel = true,
  className,
}: Omit<FeaturedBadgeProps, "type">) {
  return (
    <FeaturedBadge
      type="spotlight"
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

interface ConditionalFeaturedBadgeProps extends Omit<FeaturedBadgeProps, "type"> {
  featureType?: FeatureType | null;
}

export function ConditionalFeaturedBadge({
  featureType,
  ...props
}: ConditionalFeaturedBadgeProps) {
  if (!featureType) return null;
  return <FeaturedBadge type={featureType} {...props} />;
}
