"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChip {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Filter type (category, tag, difficulty, etc.) */
  type: string;
  /** Original value */
  value: string;
}

interface ActiveFilterChipsProps {
  /** List of active filters */
  filters: FilterChip[];
  /** Callback when a filter is removed */
  onRemove: (filter: FilterChip) => void;
  /** Callback to clear all filters */
  onClearAll?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * ActiveFilterChips - Display and manage active filter selections.
 *
 * Features:
 * - Animated add/remove transitions
 * - Clear all button
 * - Filter type indicators
 * - Touch-friendly chip targets
 *
 * @example
 * ```tsx
 * <ActiveFilterChips
 *   filters={[
 *     { id: "cat-coding", label: "Coding", type: "category", value: "coding" },
 *     { id: "tag-react", label: "react", type: "tag", value: "react" },
 *   ]}
 *   onRemove={(filter) => removeFilter(filter)}
 *   onClearAll={() => clearAllFilters()}
 * />
 * ```
 */
export function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <AnimatePresence mode="popLayout">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onRemove(filter)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5",
              "rounded-full text-sm font-medium",
              "bg-indigo-100 dark:bg-indigo-900/30",
              "text-indigo-700 dark:text-indigo-300",
              "border border-indigo-200/50 dark:border-indigo-700/50",
              "hover:bg-indigo-200 dark:hover:bg-indigo-800/40",
              "transition-colors",
              "min-h-[36px] touch-manipulation"
            )}
            aria-label={`Remove ${filter.type}: ${filter.label}`}
          >
            <span className="text-[10px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              {filter.type}:
            </span>
            <span className="capitalize">{filter.label}</span>
            <X className="w-3.5 h-3.5 ml-0.5" />
          </motion.button>
        ))}

        {/* Clear all button */}
        {onClearAll && filters.length > 1 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            onClick={onClearAll}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5",
              "rounded-full text-sm font-medium",
              "bg-zinc-100 dark:bg-zinc-800",
              "text-zinc-600 dark:text-zinc-400",
              "hover:bg-zinc-200 dark:hover:bg-zinc-700",
              "transition-colors",
              "min-h-[36px] touch-manipulation"
            )}
            aria-label="Clear all filters"
          >
            Clear all
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ActiveFilterChips;
