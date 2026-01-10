// packages/core/src/search/engine.ts
// Composite search engine combining BM25 with optional semantic reranking

import type { Prompt } from "../prompts/types";
import { prompts, getPrompt } from "../prompts/registry";
import { buildIndex, search as bm25Search, type BM25Index } from "./bm25";
import { tokenize } from "./tokenize";
import { expandQuery } from "./synonyms";

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
}

// Lazy-initialized index
let _index: BM25Index | null = null;

function getIndex(): BM25Index {
  if (!_index) {
    _index = buildIndex(prompts);
  }
  return _index;
}

/**
 * Reset the search index (call when prompts change)
 */
export function resetIndex(): void {
  _index = null;
}

/**
 * Search prompts with BM25
 */
export function searchPrompts(
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    limit = 20,
    category,
    tags,
    expandSynonyms = true,
  } = options;

  // Get base results from BM25
  const index = getIndex();

  // Optionally expand query with synonyms
  let searchQuery = query;
  if (expandSynonyms) {
    const tokens = tokenize(query);
    const expanded = expandQuery(tokens);
    searchQuery = expanded.join(" ");
  }

  const bm25Results = bm25Search(index, searchQuery, limit * 2);

  // Map to full results and apply filters
  let results: SearchResult[] = bm25Results
    .map(({ id, score }) => {
      const prompt = getPrompt(id);
      if (!prompt) return null;

      // Determine which fields matched
      const matchedFields: string[] = [];
      const queryLower = query.toLowerCase();
      if (prompt.title.toLowerCase().includes(queryLower)) matchedFields.push("title");
      if (prompt.description.toLowerCase().includes(queryLower)) matchedFields.push("description");
      if (prompt.tags.some((t) => t.toLowerCase().includes(queryLower))) matchedFields.push("tags");
      if (prompt.content.toLowerCase().includes(queryLower)) matchedFields.push("content");

      return { prompt, score, matchedFields };
    })
    .filter((r): r is SearchResult => r !== null);

  // Apply category filter
  if (category) {
    results = results.filter((r) => r.prompt.category === category);
  }

  // Apply tags filter (match any)
  if (tags?.length) {
    results = results.filter((r) =>
      tags.some((tag) => r.prompt.tags.includes(tag))
    );
  }

  return results.slice(0, limit);
}

/**
 * Quick search for autocomplete (lighter weight)
 */
export function quickSearch(query: string, limit: number = 5): Prompt[] {
  if (!query.trim()) return [];
  return searchPrompts(query, { limit, expandSynonyms: false }).map((r) => r.prompt);
}
