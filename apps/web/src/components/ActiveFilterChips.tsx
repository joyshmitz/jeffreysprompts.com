"use client";

import type { ReactNode } from "react";
import { Search, Folder, Tag, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PromptCategory } from "@jeffreysprompts/core/prompts/types";

interface ActiveFilterChipsProps {
  query: string;
  category: PromptCategory | null;
  tags: string[];
  onRemoveQuery: () => void;
  onRemoveCategory: () => void;
  onRemoveTag: (tag: string) => void;
  onClearAll: () => void;
}

interface FilterChipProps {
  label: string;
  ariaLabel: string;
  icon?: ReactNode;
  onRemove: () => void;
  className?: string;
}

function FilterChip({ label, ariaLabel, icon, onRemove, className }: FilterChipProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      layout={!prefersReducedMotion}
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
      data-testid="filter-chip"
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm",
        "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm font-semibold text-neutral-700 dark:text-neutral-300",
        "group transition-all hover:border-indigo-500/30 hover:shadow-indigo-500/5",
        className
      )}
    >
      {icon && (
        <span className="text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">{icon}</span>
      )}
      <span className="max-w-[150px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 p-0.5 rounded-full text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 touch-manipulation"
        aria-label={ariaLabel}
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </motion.span>
  );
}

export function ActiveFilterChips({
  query,
  category,
  tags,
  onRemoveQuery,
  onRemoveCategory,
  onRemoveTag,
  onClearAll,
}: ActiveFilterChipsProps) {
  const hasFilters = query || category || tags.length > 0;
  const prefersReducedMotion = useReducedMotion();

  if (!hasFilters) return null;

  return (
    <motion.div
      layout={!prefersReducedMotion}
      role="region"
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-3 py-6 border-b border-neutral-200 dark:border-neutral-800"
    >
      <motion.span 
        layout={!prefersReducedMotion}
        className="text-xs font-bold uppercase tracking-widest text-neutral-400 mr-2"
      >
        Active Filters
      </motion.span>

      <AnimatePresence mode="popLayout">
        {/* Search query chip */}
        {query && (
          <FilterChip
            key="query"
            label={`"${query}"`}
            ariaLabel={`Remove search filter: ${query}`}
            icon={<Search className="w-3.5 h-3.5" />}
            onRemove={onRemoveQuery}
          />
        )}

        {/* Category chip */}
        {category && (
          <FilterChip
            key="category"
            label={category}
            ariaLabel={`Remove category filter: ${category}`}
            icon={<Folder className="w-3.5 h-3.5" />}
            onRemove={onRemoveCategory}
            className="capitalize"
          />
        )}

        {/* Tag chips */}
        {tags.map((tag) => (
          <FilterChip
            key={`tag-${tag}`}
            label={tag}
            ariaLabel={`Remove tag filter: ${tag}`}
            icon={<Tag className="w-3.5 h-3.5" />}
            onRemove={() => onRemoveTag(tag)}
          />
        ))}
      </AnimatePresence>

      {/* Clear all */}
      <motion.button
        layout={!prefersReducedMotion}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        type="button"
        onClick={onClearAll}
        className="ml-2 text-xs font-bold text-neutral-400 hover:text-rose-500 transition-colors uppercase tracking-widest rounded px-2 py-1 hover:bg-rose-500/5 touch-manipulation"
        aria-label="Clear all active filters"
      >
        Clear all
      </motion.button>
    </motion.div>
  );
}
