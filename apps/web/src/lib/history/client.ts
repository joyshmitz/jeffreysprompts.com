"use client";

import type { HistoryResourceType } from "./types";

const LOCAL_USER_ID_KEY = "jfpUserId";
const MAX_QUERY_LENGTH = 500;

export function getOrCreateLocalUserId(): string | null {
  if (typeof window === "undefined") return null;

  let userId = window.localStorage.getItem(LOCAL_USER_ID_KEY);
  if (!userId) {
    userId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `user-${Math.random().toString(36).slice(2, 9)}`;
    window.localStorage.setItem(LOCAL_USER_ID_KEY, userId);
  }

  return userId;
}

export async function trackHistoryView(input: {
  resourceType: HistoryResourceType;
  resourceId?: string | null;
  searchQuery?: string | null;
  source?: string | null;
}): Promise<void> {
  const userId = getOrCreateLocalUserId();
  if (!userId) return;

  const payload = {
    userId,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    searchQuery:
      input.searchQuery && input.searchQuery.length > MAX_QUERY_LENGTH
        ? input.searchQuery.slice(0, MAX_QUERY_LENGTH)
        : input.searchQuery ?? null,
    source: input.source ?? null,
  };

  try {
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore history tracking failures
  }
}

export async function clearHistoryForUser(): Promise<void> {
  const userId = getOrCreateLocalUserId();
  if (!userId) return;

  try {
    await fetch(`/api/history?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore failures
  }
}
