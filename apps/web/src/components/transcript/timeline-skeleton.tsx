"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineSkeletonProps {
  /** Number of section groups to show */
  sections?: number;
  /** Number of message previews per section */
  messagesPerSection?: number;
}

/**
 * Loading skeleton for TranscriptTimeline.
 * Matches the structure of the actual timeline for seamless transitions.
 */
export function TimelineSkeleton({
  sections = 3,
  messagesPerSection = 3,
}: TimelineSkeletonProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[1.125rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-zinc-300 via-zinc-200 to-zinc-300 dark:from-zinc-700 dark:via-zinc-600 dark:to-zinc-700 opacity-30" />

      {/* Section groups */}
      <div className="space-y-4">
        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <SectionSkeleton
            key={sectionIndex}
            index={sectionIndex}
            messageCount={messagesPerSection}
          />
        ))}
      </div>
    </div>
  );
}

interface SectionSkeletonProps {
  index: number;
  messageCount: number;
}

function SectionSkeleton({ index, messageCount }: SectionSkeletonProps) {
  return (
    <div className="relative">
      {/* Section header */}
      <div className="flex items-center gap-3 p-3">
        {/* Section number circle */}
        <Skeleton
          variant="pulse"
          className={cn(
            "relative z-10 w-8 h-8 rounded-full",
            "bg-zinc-200 dark:bg-zinc-700"
          )}
        />

        {/* Section info */}
        <div className="flex-1 space-y-2">
          <Skeleton
            variant="pulse"
            className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700"
          />
          <Skeleton
            variant="pulse"
            className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800"
          />
        </div>

        {/* Expand indicator */}
        <Skeleton
          variant="pulse"
          className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800"
        />
      </div>

      {/* Message previews (first section expanded) */}
      {index === 0 && (
        <div className="pl-11 space-y-2 py-2">
          {Array.from({ length: messageCount }).map((_, msgIndex) => (
            <MessagePreviewSkeleton key={msgIndex} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessagePreviewSkeleton() {
  return (
    <div
      className={cn(
        "p-3 rounded-lg",
        "border-l-2 border-zinc-200 dark:border-zinc-700"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton
          variant="pulse"
          className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700"
        />
        <Skeleton
          variant="pulse"
          className="h-3 w-12 bg-zinc-200 dark:bg-zinc-700"
        />
        <Skeleton
          variant="pulse"
          className="h-3 w-10 bg-zinc-100 dark:bg-zinc-800"
        />
      </div>

      {/* Content preview */}
      <div className="space-y-1.5">
        <Skeleton
          variant="pulse"
          className="h-3 w-full bg-zinc-100 dark:bg-zinc-800"
        />
        <Skeleton
          variant="pulse"
          className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-800"
        />
      </div>
    </div>
  );
}

/**
 * Compact skeleton for inline loading states.
 */
export function TimelineSkeletonCompact() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton
            variant="pulse"
            className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700"
          />
          <div className="flex-1 space-y-1">
            <Skeleton
              variant="pulse"
              className="h-3 w-full bg-zinc-100 dark:bg-zinc-800"
            />
            <Skeleton
              variant="pulse"
              className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
