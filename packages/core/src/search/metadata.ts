// packages/core/src/search/metadata.ts
// Re-export prompt metadata helpers for search consumers

export {
  findSimilarPrompts,
  suggestPromptMetadata,
  findDuplicateCandidates,
} from "../prompts/metadata";
export type {
  SimilarPrompt,
  TagSuggestion,
  CategorySuggestion,
  DescriptionSuggestion,
  MetadataSuggestions,
  DuplicateCandidate,
  MetadataOptions,
  DuplicateOptions,
} from "../prompts/metadata";
