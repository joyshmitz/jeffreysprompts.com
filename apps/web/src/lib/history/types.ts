export type HistoryResourceType =
  | "prompt"
  | "collection"
  | "skill"
  | "bundle"
  | "workflow"
  | "search";

export const HISTORY_RESOURCE_TYPES: HistoryResourceType[] = [
  "prompt",
  "collection",
  "skill",
  "bundle",
  "workflow",
  "search",
];

export function isHistoryResourceType(value: string): value is HistoryResourceType {
  return HISTORY_RESOURCE_TYPES.includes(value as HistoryResourceType);
}

export interface ViewHistoryEntry {
  id: string;
  userId: string;
  resourceType: HistoryResourceType;
  resourceId: string | null;
  searchQuery: string | null;
  source: string | null;
  viewedAt: string;
  duration: number | null;
}
