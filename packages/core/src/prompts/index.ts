/**
 * Prompts module
 * Types, registry, bundles, and workflows for prompts
 */

// Core types
export type {
  Prompt,
  PromptMeta,
  PromptCategory,
  PromptDifficulty,
  PromptVariable,
  PromptVariableType,
  PromptChange,
  PromptWithHtml,
} from "./types";

// Registry and derived data
export {
  prompts,
  categories,
  tags,
  featuredPrompts,
  promptsById,
  getPrompt,
  getPromptsByCategory,
  getPromptsByTag,
  searchPromptsByText,
} from "./registry";

// Bundles
export type { Bundle, BundleIcon } from "./bundles";
export {
  bundles,
  getBundle,
  getBundlePrompts,
  generateBundleSkillMd,
  featuredBundles,
  bundlesById,
} from "./bundles";

// Workflows
export type { Workflow, WorkflowStep } from "./workflows";
export { workflows, getWorkflow } from "./workflows";

// Metadata suggestions + duplicate detection
export type {
  SimilarPrompt,
  TagSuggestion,
  CategorySuggestion,
  DescriptionSuggestion,
  MetadataSuggestions,
  DuplicateCandidate,
  MetadataOptions,
  DuplicateOptions,
} from "./metadata";
export {
  findSimilarPrompts,
  suggestPromptMetadata,
  findDuplicateCandidates,
} from "./metadata";

// Schema validation
export {
  PromptSchema,
  PromptCategorySchema,
  PromptDifficultySchema,
  PromptVariableSchema,
  PromptVariableTypeSchema,
  PromptChangeSchema,
  validatePrompt,
  validatePrompts,
} from "./schema";
