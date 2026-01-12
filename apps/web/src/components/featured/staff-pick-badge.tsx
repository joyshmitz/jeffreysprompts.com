/**
 * Featured Content Badges
 *
 * Displays badge indicators for staff picks, featured content, and spotlights.
 */

import { Star, Sparkles, Award } from "lucide-react";
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
  }
> = {
  staff_pick: {
    label: "Staff Pick",
    icon: Star,
    colors:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  },
  featured: {
    label: "Featured",
    icon: Sparkles,
    colors:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30",
  },
  spotlight: {
    label: "Spotlight",
    icon: Award,
    colors:
      "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30",
  },
};

const SIZE_CLASSES = {
  sm: {
    wrapper: "px-1.5 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
  },
  md: {
    wrapper: "px-2 py-0.5 text-xs gap-1.5",
    icon: "h-3.5 w-3.5",
  },
  lg: {
    wrapper: "px-2.5 py-1 text-sm gap-1.5",
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
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium whitespace-nowrap",
        config.colors,
        sizeClasses.wrapper,
        className
      )}
    >
      <Icon className={sizeClasses.icon} />
      {showLabel && <span>{config.label}</span>}
    </span>
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
