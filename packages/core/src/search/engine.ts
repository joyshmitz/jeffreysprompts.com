// packages/core/src/search/engine.ts
// Search engine: thin filter layer over the precomputed multi-signal scorer.
// BM25 is no longer in the hot path — the scorer handles exact, prefix,
// fuzzy, substring, synonym, acronym, and phrase matching natively.

import type { Prompt } from "../prompts/types";
import { prompts, promptsById } from "../prompts/registry";
import {
  buildScorerIndex,
  searchScorerIndex,
  type ScorerIndex,
} from "./scorer";

export interface SearchResult {
  prompt: Prompt;
  score: number;
  matchedFields: string[];
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  tags?: string[];
  expandSynonyms?: boolean;
  promptsMap?: Map<string, Prompt>;
  scorerIndex?: ScorerIndex;
}

// Lazy-initialized scorer index
let _scorerIndex: ScorerIndex | null = null;
let _filterIndex: {
  byCategory: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
} | null = null;

function getScorerIndex(): ScorerIndex {
  if (!_scorerIndex) {
    _scorerIndex = buildScorerIndex(prompts);
  }
  return _scorerIndex;
}

function getFilterIndex() {
  if (_filterIndex) return _filterIndex;

  const byCategory = new Map<string, Set<string>>();
  const byTag = new Map<string, Set<string>>();

  for (const prompt of prompts) {
    let categoryIds = byCategory.get(prompt.category);
    if (!categoryIds) {
      categoryIds = new Set<string>();
      byCategory.set(prompt.category, categoryIds);
    }
    categoryIds.add(prompt.id);

    for (const tag of prompt.tags) {
      let tagIds = byTag.get(tag);
      if (!tagIds) {
        tagIds = new Set<string>();
        byTag.set(tag, tagIds);
      }
      tagIds.add(prompt.id);
    }
  }

  _filterIndex = { byCategory, byTag };
  return _filterIndex;
}

function buildCandidateIds(
  promptsMap: Map<string, Prompt>,
  category?: string,
  tags?: string[],
): Set<string> | null {
  if (!category && !tags?.length) return null;

  if (promptsMap === promptsById) {
    const { byCategory, byTag } = getFilterIndex();

    const categoryCandidates = category
      ? new Set(byCategory.get(category) ?? [])
      : null;
    const tagCandidates = tags?.length
      ? (() => {
          const ids = new Set<string>();
          for (const tag of tags) {
            const tagIds = byTag.get(tag);
            if (!tagIds) continue;
            for (const id of tagIds) ids.add(id);
          }
          return ids;
        })()
      : null;

    if (categoryCandidates && tagCandidates) {
      for (const id of categoryCandidates) {
        if (!tagCandidates.has(id)) categoryCandidates.delete(id);
      }
      return categoryCandidates;
    }

    return categoryCandidates ?? tagCandidates ?? null;
  }

  const ids = new Set<string>();
  for (const [id, prompt] of promptsMap) {
    if (category && prompt.category !== category) continue;
    if (tags?.length && !tags.some((tag) => prompt.tags.includes(tag))) continue;
    ids.add(id);
  }
  return ids;
}

/**
 * Reset the search index (call when prompts change)
 */
export function resetIndex(): void {
  _scorerIndex = null;
  _filterIndex = null;
}

/**
 * Search prompts with multi-signal scorer.
 *
 * Handles prefix, fuzzy, exact, substring, synonym, acronym, and phrase
 * matching in a single precomputed index pass. No BM25 needed.
 */
export function searchPrompts(
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  const {
    limit = 20,
    category,
    tags,
    expandSynonyms = true,
    promptsMap = promptsById,
    scorerIndex = getScorerIndex(),
  } = options;

  const candidateIds = buildCandidateIds(promptsMap, category, tags);
  if (candidateIds && candidateIds.size === 0) return [];

  const scored = searchScorerIndex(scorerIndex, query, {
    expandSynonyms,
    candidateIds,
    limit,
  });

  // Filter by category/tags and enforce limit
  const results: SearchResult[] = [];
  for (const { id, score, matchedFields } of scored) {
    if (results.length >= limit) break;

    const prompt = promptsMap.get(id);
    if (!prompt) continue;

    results.push({ prompt, score, matchedFields });
  }

  return results;
}

/**
 * Quick search for autocomplete (lighter weight)
 */
export function quickSearch(query: string, limit: number = 5): Prompt[] {
  if (!query.trim()) return [];
  return searchPrompts(query, { limit, expandSynonyms: false }).map(
    (r) => r.prompt,
  );
}
