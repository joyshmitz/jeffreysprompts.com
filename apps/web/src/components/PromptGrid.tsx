"use client";

import { PromptCard } from "./PromptCard";
import { SwipeablePromptCard } from "@/components/mobile/SwipeablePromptCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsSmallScreen } from "@/hooks/useIsMobile";
import type { Prompt } from "@jeffreysprompts/core/prompts/types";

interface PromptGridProps {
  prompts: Prompt[];
  loading?: boolean;
  onPromptCopy?: (prompt: Prompt) => void;
  onPromptClick?: (prompt: Prompt) => void;
}

export function PromptGrid({
  prompts,
  loading = false,
  onPromptCopy,
  onPromptClick,
}: PromptGridProps) {
  const isMobile = useIsSmallScreen();

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <PromptCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-neutral-400 dark:text-neutral-500 mb-2">No prompts found</div>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt, index) =>
        isMobile ? (
          <SwipeablePromptCard
            key={prompt.id}
            prompt={prompt}
            index={index}
            onCopy={onPromptCopy}
            onClick={onPromptClick}
            isMobile={isMobile}
          />
        ) : (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            index={index}
            onCopy={onPromptCopy}
            onClick={onPromptClick}
          />
        )
      )}
    </div>
  );
}

function PromptCardSkeleton() {
  return (
    <div className="flex flex-col h-full border rounded-lg p-6 bg-white dark:bg-neutral-900/50">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-auto pt-4 border-t">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex justify-end mt-3 gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
    </div>
  );
}

export default PromptGrid;
