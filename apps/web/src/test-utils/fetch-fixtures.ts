/**
 * Shared fetch mock helpers and realistic API response fixtures.
 *
 * Centralises the globalThis.fetch mocking pattern so individual hook tests
 * avoid duplicating helpers and ad-hoc fixture data.
 */

import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

/** Assign a mock to globalThis.fetch (handles the ts-expect-error once). */
export function setFetchMock(mock: ReturnType<typeof vi.fn>) {
  // @ts-expect-error: Mocking global fetch for tests
  globalThis.fetch = mock;
}

/** A mock fetch that always resolves with `{ ok: true, json: () => data }`. */
export function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

/** A mock fetch that resolves with `{ ok: false, status, json: () => body }`. */
export function mockFetchError(status = 500, body: unknown = { error: "Server error" }) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

/** A mock fetch that never resolves — useful for asserting initial loading state. */
export function mockFetchPending() {
  return vi.fn().mockImplementation(() => new Promise(() => undefined));
}

/** A mock fetch that rejects with a network error. */
export function mockFetchNetworkError(message = "Network error") {
  return vi.fn().mockRejectedValue(new Error(message));
}

// ---------------------------------------------------------------------------
// Rating fixtures
// ---------------------------------------------------------------------------

export const fixtures = {
  ratingSummary: {
    contentType: "prompt" as const,
    contentId: "idea-wizard",
    upvotes: 5,
    downvotes: 1,
    total: 6,
    approvalRate: 83,
    lastUpdated: "2026-01-15T00:00:00Z",
  },

  ratingSummaryAfterUpvote: {
    contentType: "prompt" as const,
    contentId: "idea-wizard",
    upvotes: 6,
    downvotes: 1,
    total: 7,
    approvalRate: 86,
    lastUpdated: "2026-01-15T00:00:00Z",
  },

  // GET /api/ratings response
  ratingGetResponse: {
    summary: {
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      upvotes: 5,
      downvotes: 1,
      total: 6,
      approvalRate: 83,
      lastUpdated: "2026-01-15T00:00:00Z",
    },
    userRating: null as string | null,
  },

  // POST /api/ratings response
  ratingPostResponse: {
    summary: {
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      upvotes: 6,
      downvotes: 1,
      total: 7,
      approvalRate: 86,
      lastUpdated: "2026-01-15T00:00:00Z",
    },
    rating: { value: "up" },
  },

  // ---------------------------------------------------------------------------
  // Review fixtures
  // ---------------------------------------------------------------------------

  review: {
    id: "review:prompt:idea-wizard:user-1",
    contentType: "prompt" as const,
    contentId: "idea-wizard",
    userId: "user-1",
    displayName: "TestUser",
    rating: "up" as const,
    content: "Great prompt for brainstorming product ideas.",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
    helpfulCount: 2,
    notHelpfulCount: 0,
    reported: false,
    reportInfo: null,
    authorResponse: null,
  },

  reviewSummary: {
    contentType: "prompt" as const,
    contentId: "idea-wizard",
    totalReviews: 1,
    averageHelpfulness: 100,
    recentReviews: 1,
  },

  pagination: {
    total: 1,
    limit: 10,
    offset: 0,
    hasMore: false,
  },

  // GET /api/reviews response (with reviews)
  reviewsGetResponse: {
    reviews: [
      {
        id: "review:prompt:idea-wizard:user-1",
        contentType: "prompt" as const,
        contentId: "idea-wizard",
        userId: "user-1",
        displayName: "TestUser",
        rating: "up" as const,
        content: "Great prompt for brainstorming product ideas.",
        createdAt: "2026-01-15T00:00:00Z",
        updatedAt: "2026-01-15T00:00:00Z",
        helpfulCount: 2,
        notHelpfulCount: 0,
        reported: false,
        reportInfo: null,
        authorResponse: null,
      },
    ],
    summary: {
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      totalReviews: 1,
      averageHelpfulness: 100,
      recentReviews: 1,
    },
    userReview: null,
    pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
  },

  // GET /api/reviews response (empty)
  reviewsEmptyResponse: {
    reviews: [],
    summary: {
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      totalReviews: 0,
      averageHelpfulness: 0,
      recentReviews: 0,
    },
    userReview: null,
    pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
  },

  // POST /api/reviews response
  reviewSubmitResponse: {
    success: true,
    review: {
      id: "review:prompt:idea-wizard:user-1",
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      userId: "user-1",
      displayName: "TestUser",
      rating: "up" as const,
      content: "Great prompt for brainstorming product ideas.",
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
      helpfulCount: 0,
      notHelpfulCount: 0,
      reported: false,
      reportInfo: null,
      authorResponse: null,
    },
    summary: {
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      totalReviews: 1,
      averageHelpfulness: 0,
      recentReviews: 1,
    },
    isNew: true,
  },

  // ---------------------------------------------------------------------------
  // Review vote fixtures
  // ---------------------------------------------------------------------------

  voteResponse: { vote: { isHelpful: true } },
  voteNullResponse: { vote: null },
  voteSubmitResponse: {
    vote: { isHelpful: false },
    review: {
      id: "review:prompt:idea-wizard:user-1",
      contentType: "prompt" as const,
      contentId: "idea-wizard",
      userId: "user-1",
      displayName: "TestUser",
      rating: "up" as const,
      content: "Great prompt for brainstorming product ideas.",
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
      helpfulCount: 2,
      notHelpfulCount: 1,
      reported: false,
      reportInfo: null,
      authorResponse: null,
    },
  },

  // ---------------------------------------------------------------------------
  // Leaderboard fixtures
  // ---------------------------------------------------------------------------

  leaderboardEntries: [
    {
      prompt: { id: "idea-wizard", title: "Idea Wizard", slug: "idea-wizard" },
      rating: { contentType: "prompt", contentId: "idea-wizard", upvotes: 10, downvotes: 0, total: 10, approvalRate: 100, lastUpdated: null },
    },
    {
      prompt: { id: "code-review-checklist", title: "Code Review Checklist", slug: "code-review-checklist" },
      rating: { contentType: "prompt", contentId: "code-review-checklist", upvotes: 7, downvotes: 3, total: 10, approvalRate: 70, lastUpdated: null },
    },
  ],

  leaderboardResponse: {
    entries: [
      {
        prompt: { id: "idea-wizard", title: "Idea Wizard", slug: "idea-wizard" },
        rating: { contentType: "prompt", contentId: "idea-wizard", upvotes: 10, downvotes: 0, total: 10, approvalRate: 100, lastUpdated: null },
      },
      {
        prompt: { id: "code-review-checklist", title: "Code Review Checklist", slug: "code-review-checklist" },
        rating: { contentType: "prompt", contentId: "code-review-checklist", upvotes: 7, downvotes: 3, total: 10, approvalRate: 70, lastUpdated: null },
      },
    ],
    generated_at: "2026-01-15T00:00:00Z",
  },

  // ---------------------------------------------------------------------------
  // All-ratings (bulk summaries) fixtures
  // ---------------------------------------------------------------------------

  allRatingsSummaries: {
    "idea-wizard": { contentType: "prompt", contentId: "idea-wizard", upvotes: 10, downvotes: 2, total: 12, approvalRate: 83, lastUpdated: null },
    "code-review-checklist": { contentType: "prompt", contentId: "code-review-checklist", upvotes: 5, downvotes: 1, total: 6, approvalRate: 83, lastUpdated: null },
  } as Record<string, { contentType: string; contentId: string; upvotes: number; downvotes: number; total: number; approvalRate: number; lastUpdated: string | null }>,

  allRatingsResponse: {
    summaries: {
      "idea-wizard": { contentType: "prompt", contentId: "idea-wizard", upvotes: 10, downvotes: 2, total: 12, approvalRate: 83, lastUpdated: null },
      "code-review-checklist": { contentType: "prompt", contentId: "code-review-checklist", upvotes: 5, downvotes: 1, total: 6, approvalRate: 83, lastUpdated: null },
    },
    generated_at: "2026-01-15T00:00:00Z",
  },
} as const;
