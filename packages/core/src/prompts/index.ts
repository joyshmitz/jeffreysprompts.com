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
export type { Bundle } from "./bundles";
export { bundles, getBundle, getBundlePrompts } from "./bundles";

// Workflows
export type { Workflow, WorkflowStep } from "./workflows";
export { workflows, getWorkflow } from "./workflows";

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
