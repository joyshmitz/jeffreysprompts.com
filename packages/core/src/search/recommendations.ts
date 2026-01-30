// packages/core/src/search/recommendations.ts
// Personalized recommendations for core Prompt registry

import type { Prompt } from "../prompts/types";

const CONFIG = {
  tagWeight: 0.6,
  categoryWeight: 0.2,
  authorWeight: 0.1,
  featuredWeight: 0.1,
  maxRecommendations: 10,
} as const;

export interface RecommendationResult {
  prompt: Prompt;
  score: number;
  reasons: string[];
}

function calculateTagSimilarity(tagsA: string[], tagsB: string[]): number {
  const setA = new Set(tagsA.map((t) => t.toLowerCase()));
  const setB = new Set(tagsB.map((t) => t.toLowerCase()));

  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function calculateFeaturedScore(prompt: Prompt): number {
  return prompt.featured ? 1 : 0;
}

export function getRelatedRecommendations(
  sourcePrompt: Prompt,
  allPrompts: Prompt[],
  options?: {
    limit?: number;
    excludeIds?: string[];
    minScore?: number;
  }
): RecommendationResult[] {
  const limit = options?.limit ?? CONFIG.maxRecommendations;
  const excludeIds = new Set([sourcePrompt.id, ...(options?.excludeIds ?? [])]);

  const recommendations: RecommendationResult[] = [];

  for (const candidate of allPrompts) {
    if (excludeIds.has(candidate.id)) continue;

    const reasons: string[] = [];
    let score = 0;

    const tagSimilarity = calculateTagSimilarity(sourcePrompt.tags, candidate.tags);
    if (tagSimilarity > 0) {
      score += tagSimilarity * CONFIG.tagWeight;
      const commonTags = sourcePrompt.tags.filter((t) =>
        candidate.tags.map((ct) => ct.toLowerCase()).includes(t.toLowerCase())
      );
      if (commonTags.length > 0) {
        reasons.push(`Similar tags: ${commonTags.slice(0, 3).join(", ")}`);
      }
    }

    if (candidate.category === sourcePrompt.category) {
      score += CONFIG.categoryWeight;
      reasons.push(`Same category: ${candidate.category}`);
    }

    if (candidate.author === sourcePrompt.author) {
      score += CONFIG.authorWeight;
      reasons.push(`By the same author: ${candidate.author}`);
    }

    const featuredScore = calculateFeaturedScore(candidate);
    if (featuredScore > 0) {
      score += featuredScore * CONFIG.featuredWeight;
      reasons.push("Featured prompt");
    }

    if (score > (options?.minScore ?? 0)) {
      recommendations.push({ prompt: candidate, score, reasons });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

export function getRecommendationsFromHistory(
  sourcePrompts: Prompt[],
  allPrompts: Prompt[],
  options?: {
    limit?: number;
    excludeIds?: string[];
  }
): RecommendationResult[] {
  const limit = options?.limit ?? CONFIG.maxRecommendations;
  const sourceIds = new Set(sourcePrompts.map((p) => p.id));
  const excludeIds = new Set([...sourceIds, ...(options?.excludeIds ?? [])]);

  const tagFrequency = new Map<string, number>();
  const categoryFrequency = new Map<string, number>();

  for (const source of sourcePrompts) {
    for (const tag of source.tags) {
      const normalized = tag.toLowerCase();
      tagFrequency.set(normalized, (tagFrequency.get(normalized) ?? 0) + 1);
    }
    categoryFrequency.set(source.category, (categoryFrequency.get(source.category) ?? 0) + 1);
  }

  const maxTagFreq = Math.max(1, ...tagFrequency.values(), 1);
  const maxCatFreq = Math.max(1, ...categoryFrequency.values(), 1);

  const recommendations: RecommendationResult[] = [];

  for (const candidate of allPrompts) {
    if (excludeIds.has(candidate.id)) continue;

    const reasons: string[] = [];
    let score = 0;

    let tagScore = 0;
    const matchedTags: string[] = [];
    for (const tag of candidate.tags) {
      const freq = tagFrequency.get(tag.toLowerCase()) ?? 0;
      if (freq > 0) {
        tagScore += freq / maxTagFreq;
        matchedTags.push(tag);
      }
    }
    if (matchedTags.length > 0) {
      score += (tagScore / candidate.tags.length) * CONFIG.tagWeight;
      reasons.push(`Matches your interests: ${matchedTags.slice(0, 3).join(", ")}`);
    }

    const catFreq = categoryFrequency.get(candidate.category) ?? 0;
    if (catFreq > 0) {
      score += (catFreq / maxCatFreq) * CONFIG.categoryWeight;
      reasons.push(`In a category you like: ${candidate.category}`);
    }

    const featuredScore = calculateFeaturedScore(candidate);
    if (featuredScore > 0) {
      score += featuredScore * CONFIG.featuredWeight;
      reasons.push("Featured prompt");
    }

    if (score > 0) {
      recommendations.push({ prompt: candidate, score, reasons });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

export function getForYouRecommendations(
  userHistory: {
    viewed?: Prompt[];
    saved?: Prompt[];
  },
  allPrompts: Prompt[],
  options?: {
    limit?: number;
    excludeIds?: string[];
  }
): RecommendationResult[] {
  const limit = options?.limit ?? CONFIG.maxRecommendations;
  const excludeIds = new Set(options?.excludeIds ?? []);
  const sourcePrompts: Prompt[] = [];

  if (userHistory.saved) {
    for (const prompt of userHistory.saved) {
      sourcePrompts.push(prompt, prompt);
      excludeIds.add(prompt.id);
    }
  }

  if (userHistory.viewed) {
    for (const prompt of userHistory.viewed) {
      sourcePrompts.push(prompt);
      excludeIds.add(prompt.id);
    }
  }

  if (sourcePrompts.length === 0) {
    return allPrompts
      .filter((prompt) => !excludeIds.has(prompt.id))
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, limit)
      .map((prompt) => ({
        prompt,
        score: prompt.featured ? 1 : 0.5,
        reasons: [prompt.featured ? "Featured prompt" : "Popular in the library"],
      }));
  }

  return getRecommendationsFromHistory(sourcePrompts, allPrompts, {
    limit,
    excludeIds: [...excludeIds],
  });
}
