"use client";

import { useEffect } from "react";
import type { HistoryResourceType } from "@/lib/history/types";
import { trackHistoryView } from "@/lib/history/client";

interface HistoryTrackerProps {
  resourceType: HistoryResourceType;
  resourceId?: string | null;
  searchQuery?: string | null;
  source?: string | null;
}

export function HistoryTracker({
  resourceType,
  resourceId,
  searchQuery,
  source,
}: HistoryTrackerProps) {
  useEffect(() => {
    trackHistoryView({ resourceType, resourceId, searchQuery, source });
  }, [resourceType, resourceId, searchQuery, source]);

  return null;
}
