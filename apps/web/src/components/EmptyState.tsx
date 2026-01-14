"use client";

/**
 * EmptyState - Reusable empty state component with variants
 *
 * Provides consistent empty state UI across the application with
 * animated entrance effects and appropriate messaging.
 *
 * Variants:
 * - search: No search results found
 * - filter: No items match current filters
 * - content: No content available yet
 * - error: Something went wrong
 */

import { motion } from "framer-motion";
import { Search, Filter, Inbox, AlertCircle, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "search" | "filter" | "content" | "error";

interface VariantConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}

const variantConfigs: Record<EmptyStateVariant, VariantConfig> = {
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
    iconColor: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  filter: {
    icon: Filter,
    title: "No matches",
    description: "No items match your current filters. Try broadening your criteria.",
    iconColor: "text-amber-500 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  content: {
    icon: Inbox,
    title: "Nothing here yet",
    description: "This space is waiting for content to be added.",
    iconColor: "text-neutral-500 dark:text-neutral-400",
    iconBg: "bg-neutral-100 dark:bg-neutral-800",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error. Please try again.",
    iconColor: "text-red-500 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
  },
};

interface EmptyStateProps {
  /** The variant determines the icon, colors, and default messaging */
  variant?: EmptyStateVariant;
  /** Custom title (overrides variant default) */
  title?: string;
  /** Custom description (overrides variant default) */
  description?: string;
  /** Custom icon (overrides variant default) */
  icon?: LucideIcon;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "default" | "lg";
  /** Disable entrance animation */
  disableAnimation?: boolean;
}

export function EmptyState({
  variant = "content",
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = "default",
  disableAnimation = false,
}: EmptyStateProps) {
  const config = variantConfigs[variant];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldAnimate = !disableAnimation && !prefersReducedMotion;

  const sizeClasses = {
    sm: {
      container: "py-6",
      icon: "h-10 w-10",
      iconSize: "h-5 w-5",
      title: "text-base",
      description: "text-sm",
    },
    default: {
      container: "py-12",
      icon: "h-14 w-14",
      iconSize: "h-7 w-7",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16",
      iconSize: "h-8 w-8",
      title: "text-xl",
      description: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const Wrapper = shouldAnimate ? motion.div : "div";
  const Item = shouldAnimate ? motion.div : "div";

  return (
    <Wrapper
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
      {...(shouldAnimate && {
        initial: "hidden",
        animate: "visible",
        variants: containerVariants,
      })}
    >
      {/* Icon */}
      <Item
        className={cn(
          "mb-4 flex items-center justify-center rounded-full",
          config.iconBg,
          sizes.icon
        )}
        {...(shouldAnimate && { variants: itemVariants })}
      >
        <Icon className={cn(config.iconColor, sizes.iconSize)} />
      </Item>

      {/* Title */}
      <Item
        {...(shouldAnimate && { variants: itemVariants })}
      >
        <h3
          className={cn(
            "font-semibold text-foreground",
            sizes.title
          )}
        >
          {displayTitle}
        </h3>
      </Item>

      {/* Description */}
      <Item
        {...(shouldAnimate && { variants: itemVariants })}
      >
        <p
          className={cn(
            "mt-1 max-w-md text-muted-foreground",
            sizes.description
          )}
        >
          {displayDescription}
        </p>
      </Item>

      {/* Actions */}
      {(action || secondaryAction) && (
        <Item
          className="mt-6 flex items-center gap-3"
          {...(shouldAnimate && { variants: itemVariants })}
        >
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              className="gap-2"
            >
              {variant === "error" && <RefreshCw className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </Item>
      )}
    </Wrapper>
  );
}

/**
 * EmptyStateInline - Compact inline version for use in cards/lists
 */
interface EmptyStateInlineProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyStateInline({
  variant = "content",
  title,
  description,
  className,
}: EmptyStateInlineProps) {
  const config = variantConfigs[variant];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm",
        className
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.iconBg
        )}
      >
        <Icon className={cn(config.iconColor, "h-4 w-4")} />
      </div>
      <div>
        <p className="font-medium text-foreground">{displayTitle}</p>
        <p className="text-muted-foreground">{displayDescription}</p>
      </div>
    </div>
  );
}

export default EmptyState;
