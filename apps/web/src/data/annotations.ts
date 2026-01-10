/**
 * Static annotations for the "How It Was Made" transcript page.
 * These editorial comments are merged with ProcessedTranscript at render time.
 *
 * To add an annotation:
 * 1. Find the message ID from the transcript JSON
 * 2. Add an entry to the annotations map below
 * 3. Choose the appropriate type for the insight
 */

import { type TranscriptHighlight } from "@/lib/transcript/types";

/**
 * Annotation types and their meanings:
 * - key_decision: Major architectural or technical decisions
 * - interesting_prompt: Notable prompting techniques or patterns
 * - clever_solution: Elegant implementations or problem-solving approaches
 * - lesson_learned: Insights that could help future development
 */

/**
 * Map of message IDs to their annotations.
 * Keyed by message ID for O(1) lookup when rendering.
 */
export const annotationsMap: Record<string, Omit<TranscriptHighlight, "messageId">> = {
  // Example annotations - replace with real message IDs from transcript
  // These serve as templates for the editorial commentary style

  // "msg-001": {
  //   type: "key_decision",
  //   annotation: "Chose TypeScript-native prompts over markdown files for type safety and IDE support.",
  // },

  // "msg-042": {
  //   type: "interesting_prompt",
  //   annotation: "Using 'ultrathink' combined with structured brainstorming produces higher quality ideas.",
  // },

  // "msg-100": {
  //   type: "clever_solution",
  //   annotation: "BM25 search with weighted fields gives better results than simple text matching.",
  // },

  // "msg-200": {
  //   type: "lesson_learned",
  //   annotation: "Always verify design system compatibility before copying components.",
  // },
};

/**
 * Convert annotations map to array format for ProcessedTranscript.
 * @returns Array of TranscriptHighlight objects
 */
export function getAnnotations(): TranscriptHighlight[] {
  return Object.entries(annotationsMap).map(([messageId, annotation]) => ({
    messageId,
    ...annotation,
  }));
}

/**
 * Get annotation for a specific message ID.
 * @param messageId - The message ID to look up
 * @returns The annotation if found, or undefined
 */
export function getAnnotationForMessage(
  messageId: string
): Omit<TranscriptHighlight, "messageId"> | undefined {
  return annotationsMap[messageId];
}

/**
 * Check if a message has an annotation.
 * @param messageId - The message ID to check
 * @returns True if the message has an annotation
 */
export function hasAnnotation(messageId: string): boolean {
  return messageId in annotationsMap;
}

/**
 * Get all annotated message IDs.
 * Useful for highlighting annotated messages in the timeline.
 * @returns Set of message IDs that have annotations
 */
export function getAnnotatedMessageIds(): Set<string> {
  return new Set(Object.keys(annotationsMap));
}

/**
 * Get annotations grouped by type.
 * Useful for displaying insights by category.
 * @returns Object with arrays of annotations grouped by type
 */
export function getAnnotationsByType(): Record<
  TranscriptHighlight["type"],
  TranscriptHighlight[]
> {
  const grouped: Record<TranscriptHighlight["type"], TranscriptHighlight[]> = {
    key_decision: [],
    interesting_prompt: [],
    clever_solution: [],
    lesson_learned: [],
  };

  for (const [messageId, annotation] of Object.entries(annotationsMap)) {
    grouped[annotation.type].push({ messageId, ...annotation });
  }

  return grouped;
}
