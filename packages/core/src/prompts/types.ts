// packages/core/src/prompts/types.ts
// TypeScript-native prompt type definitions

export type PromptCategory =
  | "ideation"        // Brainstorming, creativity
  | "documentation"   // READMEs, docs, comments
  | "automation"      // Robot mode, CLI, agents
  | "refactoring"     // Code improvement
  | "testing"         // Test generation
  | "debugging"       // Bug finding/fixing
  | "workflow"        // Process improvement
  | "communication";  // Writing, feedback

export type PromptDifficulty = "beginner" | "intermediate" | "advanced";

export type PromptVariableType = "text" | "multiline" | "select" | "file" | "path";

export interface PromptVariable {
  name: string; // e.g. "PROJECT_NAME"
  label: string;
  description?: string;
  type: PromptVariableType;
  required?: boolean;
  options?: string[]; // for select
  default?: string;
}

export interface PromptChange {
  version: string;
  date: string; // ISO 8601
  type: "improvement" | "fix" | "breaking";
  summary: string;
}

export interface PromptMeta {
  /** Unique identifier (kebab-case, stable, never change once published) */
  id: string;

  /** Human-readable title */
  title: string;

  /** One-line description for cards and search */
  description: string;

  /** Category for filtering */
  category: PromptCategory;

  /** Tags for search and filtering */
  tags: string[];

  /** Author attribution */
  author: string;

  /** Twitter handle */
  twitter?: string;

  /** Semantic version */
  version: string;

  /** Featured on homepage */
  featured?: boolean;

  /** Difficulty level */
  difficulty?: PromptDifficulty;

  /** Approximate input token count */
  estimatedTokens?: number;

  /** Creation date (ISO 8601) */
  created: string;

  /** Last update date (ISO 8601) */
  updatedAt?: string;
}

export interface Prompt extends PromptMeta {
  /** The actual prompt content (plain text with optional markdown) */
  content: string;

  /** Variables for templated prompts ({{VARS}}) */
  variables?: PromptVariable[];

  /** When to use this prompt (for skills export) */
  whenToUse?: string[];

  /** Usage tips (for skills export) */
  tips?: string[];

  /** Example scenarios */
  examples?: string[];

  /** Optional changelog entries for updates */
  changelog?: PromptChange[];
}

export interface PromptWithHtml extends Prompt {
  /** Pre-rendered HTML for display */
  contentHtml: string;
}
