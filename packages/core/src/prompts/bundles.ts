// packages/core/src/prompts/bundles.ts
// Prompt bundles - curated collections of related prompts

import type { Prompt } from "./types";
import { prompts, getPrompt } from "./registry";

export interface Bundle {
  id: string;
  title: string;
  description: string;
  promptIds: string[];
  author: string;
  created: string;
}

export const bundles: Bundle[] = [
  {
    id: "jeffrey-essentials",
    title: "Jeffrey's Essentials",
    description: "The core prompts from Jeffrey's 'My Favorite Prompts' series",
    promptIds: ["idea-wizard", "readme-reviser", "robot-mode-maker"],
    author: "Jeffrey Emanuel",
    created: "2025-01-09",
  },
];

export function getBundle(id: string): Bundle | undefined {
  return bundles.find((b) => b.id === id);
}

export function getBundlePrompts(bundle: Bundle): Prompt[] {
  return bundle.promptIds
    .map((id) => getPrompt(id))
    .filter((p): p is Prompt => p !== undefined);
}
