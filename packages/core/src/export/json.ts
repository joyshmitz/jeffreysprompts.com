// packages/core/src/export/json.ts
// JSON export for registry and prompts

import type { Prompt } from "../prompts/types";
import { prompts, categories, tags } from "../prompts/registry";
import { bundles } from "../prompts/bundles";
import { workflows } from "../prompts/workflows";

export interface RegistryPayload {
  schemaVersion: number;
  version: string;
  generatedAt: string;
  prompts: Prompt[];
  bundles: typeof bundles;
  workflows: typeof workflows;
  meta: {
    promptCount: number;
    categories: string[];
    tags: string[];
  };
}

/**
 * Build the full registry payload for API responses
 */
export function buildRegistryPayload(version: string = "1.0.0"): RegistryPayload {
  return {
    schemaVersion: 1,
    version,
    generatedAt: new Date().toISOString(),
    prompts,
    bundles,
    workflows,
    meta: {
      promptCount: prompts.length,
      categories: categories as string[],
      tags,
    },
  };
}

/**
 * Build minimal prompt list for listing
 */
export function buildPromptList(): Pick<Prompt, "id" | "title" | "description" | "category" | "tags">[] {
  return prompts.map(({ id, title, description, category, tags }) => ({
    id,
    title,
    description,
    category,
    tags,
  }));
}
