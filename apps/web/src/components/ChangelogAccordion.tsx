"use client";

import { useState, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PromptChange } from "@jeffreysprompts/core/prompts/types";
import { ChevronRight, Sparkles, Wrench, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChangelogAccordionProps {
  changelog?: PromptChange[];
  className?: string;
}

const typeConfig: Record<string, {
  label: string;
  icon: typeof Sparkles;
  className: string;
}> = {
  improvement: {
    label: "Improvement",
    icon: Sparkles,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  fix: {
    label: "Fix",
    icon: Wrench,
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  breaking: {
    label: "Breaking",
    icon: AlertTriangle,
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

// Fallback for unknown types (defensive)
const defaultConfig = {
  label: "Update",
  icon: Sparkles,
  className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
};

/**
 * Format ISO date string for display.
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * ChangelogAccordion - Displays version history for a prompt.
 *
 * Features:
 * - Collapsed by default, expands with smooth animation
 * - Sorted newest first
 * - Human-readable date formatting
 * - Timeline visual with dots
 * - Type-specific icons and colors
 */
export function ChangelogAccordion({ changelog, className }: ChangelogAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  // Sort newest first by version (semantic versioning aware)
  const sortedChangelog = useMemo(() => {
    if (!changelog || changelog.length === 0) return [];
    return [...changelog].sort((a, b) => {
      return b.version.localeCompare(a.version, undefined, { numeric: true });
    });
  }, [changelog]);

  if (sortedChangelog.length === 0) {
    return null;
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center gap-2",
            "text-left rounded-lg",
            "hover:bg-muted/50",
            "transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          id={`${contentId}-button`}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <CardTitle className="text-lg">Changelog</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {sortedChangelog.length} {sortedChangelog.length === 1 ? "version" : "versions"}
          </Badge>
        </button>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={`${contentId}-button`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {sortedChangelog.map((entry) => {
                  const config = typeConfig[entry.type] ?? defaultConfig;
                  const Icon = config.icon;

                  return (
                    <li
                      key={`${entry.version}-${entry.date}`}
                      className="pl-6 relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-border" />

                      {/* Entry header */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">v{entry.version}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(entry.date)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            config.className
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>

                      {/* Change summary */}
                      <p className="text-sm text-muted-foreground">
                        {entry.summary}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default ChangelogAccordion;
