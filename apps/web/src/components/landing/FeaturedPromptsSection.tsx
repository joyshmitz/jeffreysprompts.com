"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { PromptCardPure } from "@/components/PromptCard";
import { useBasket } from "@/hooks/use-basket";
import type { Prompt } from "@jeffreysprompts/core/prompts/types";
import type { RatingSummary } from "@/lib/ratings/rating-store";

interface FeaturedPromptsSectionProps {
  prompts: Prompt[];
  totalCount: number;
  onPromptClick: (prompt: Prompt) => void;
  onPromptCopy?: (prompt: Prompt) => void;
  ratingSummaries?: Record<string, RatingSummary>;
}

export function FeaturedPromptsSection({
  prompts,
  totalCount,
  onPromptClick,
  onPromptCopy,
  ratingSummaries,
}: FeaturedPromptsSectionProps) {
  const { items, addItem } = useBasket();
  const basketSet = useMemo(() => new Set(items), [items]);
  const handleAddToBasket = useCallback(
    (prompt: Prompt) => {
      addItem(prompt.id);
    },
    [addItem]
  );

  // Take first 6 prompts (featured ones should be at the front)
  const featuredPrompts = prompts.slice(0, 6);

  if (featuredPrompts.length === 0) return null;

  return (
    <section className="py-8 bg-white dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 overflow-x-hidden">
      <div className="container-wide px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Featured Prompts
              </h2>
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              Curated by the team
            </span>
          </div>
          <a
            href="#prompts-section"
            className="flex items-center gap-1.5 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors group/link"
          >
            View all {totalCount} prompts
            <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
          </a>
        </motion.div>

        <div className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto lg:overflow-visible scrollbar-hide">
          <div className="flex lg:grid lg:grid-cols-3 gap-4 lg:gap-6 pb-4 lg:pb-0 w-max lg:w-auto">
            {featuredPrompts.map((prompt, index) => (
              <div
                key={prompt.id}
                className="w-[300px] lg:w-auto flex-shrink-0 lg:flex-shrink"
              >
                <PromptCardPure
                  prompt={prompt}
                  ratingSummary={ratingSummaries?.[prompt.id] ?? null}
                  inBasket={basketSet.has(prompt.id)}
                  onAddToBasket={handleAddToBasket}
                  index={index}
                  onClick={onPromptClick}
                  onCopy={onPromptCopy}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
