import { describe, it, expect } from "vitest";
import {
  getRatingSummary,
  getUserRating,
  submitRating,
} from "./rating-store";

describe("rating store", () => {
  it("returns empty summary when no ratings exist", () => {
    const summary = getRatingSummary({
      contentType: "prompt",
      contentId: "prompt-empty",
    });

    expect(summary.total).toBe(0);
    expect(summary.upvotes).toBe(0);
    expect(summary.downvotes).toBe(0);
    expect(summary.approvalRate).toBe(0);
    expect(summary.lastUpdated).toBeNull();
  });

  it("tracks votes and lastUpdated for a content item", () => {
    const first = submitRating({
      contentType: "prompt",
      contentId: "prompt-alpha",
      userId: "user-1",
      value: "up",
    });

    const second = submitRating({
      contentType: "prompt",
      contentId: "prompt-alpha",
      userId: "user-2",
      value: "down",
    });

    expect(first.summary.total).toBe(1);
    expect(second.summary.total).toBe(2);
    expect(second.summary.upvotes).toBe(1);
    expect(second.summary.downvotes).toBe(1);
    expect(second.summary.lastUpdated).toBe(second.rating.updatedAt);
  });

  it("overwrites an existing user's rating without inflating totals", () => {
    const initial = submitRating({
      contentType: "prompt",
      contentId: "prompt-beta",
      userId: "user-3",
      value: "up",
    });

    const updated = submitRating({
      contentType: "prompt",
      contentId: "prompt-beta",
      userId: "user-3",
      value: "down",
    });

    expect(initial.summary.total).toBe(1);
    expect(updated.summary.total).toBe(1);
    expect(updated.summary.upvotes).toBe(0);
    expect(updated.summary.downvotes).toBe(1);
    expect(getUserRating({
      contentType: "prompt",
      contentId: "prompt-beta",
      userId: "user-3",
    })).toBe("down");
  });
});
