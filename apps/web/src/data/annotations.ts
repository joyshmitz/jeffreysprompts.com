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
  // Project Kickoff - The original prompt that started it all
  "msg-0": {
    type: "interesting_prompt",
    annotation:
      "The initial prompt that sparked the entire project - including the three 'favorite prompts' that would become the foundation of the site's content.",
  },

  // Key architectural decision - TypeScript-native prompts
  "msg-15": {
    type: "key_decision",
    annotation:
      "Chose TypeScript-native prompts over markdown files. This eliminates parsing, provides type safety, and enables IDE autocomplete for all prompt fields.",
  },

  // BM25 Search Engine
  "msg-91": {
    type: "clever_solution",
    annotation:
      "Implemented custom BM25 search with weighted fields (title 3x, description 2x, tags 1.5x, content 1x). Much better relevance than simple text matching.",
  },

  // CLI Design Philosophy
  "msg-142": {
    type: "key_decision",
    annotation:
      "Agent-first CLI design: JSON output by default when piped, token-dense quick-start mode (~100 tokens), and meaningful exit codes for programmatic parsing.",
  },

  // Cursor tracking glow effect
  "msg-295": {
    type: "clever_solution",
    annotation:
      "PromptCard cursor-tracking glow effect using Framer Motion. Tracks mouse position to create a dynamic radial gradient that follows the cursor.",
  },

  // SpotlightSearch implementation
  "msg-369": {
    type: "key_decision",
    annotation:
      "SpotlightSearch (Cmd+K) as the primary discovery mechanism. Combines fuzzy search with recent history, category filtering, and keyboard navigation.",
  },

  // Skill manifest system
  "msg-554": {
    type: "clever_solution",
    annotation:
      "Skill manifest tracks installed prompts with SHA256 hashes. Detects user modifications to prevent accidental overwrites during updates.",
  },

  // Robot Mode philosophy
  "msg-667": {
    type: "lesson_learned",
    annotation:
      "The Robot-Mode Maker prompt in action: build tooling YOU would want to use. The CLI was designed by Claude, for Claude (and other agents).",
  },

  // Build process
  "msg-798": {
    type: "lesson_learned",
    annotation:
      "Single-file Bun binary compilation. The entire CLI compiles to one executable with no runtime dependencies - true portability.",
  },

  // Final polish
  "msg-1100": {
    type: "lesson_learned",
    annotation:
      "8 hours from first prompt to deployed site. The key was having clear patterns from brenner_bot to follow and systematic execution.",
  },
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
