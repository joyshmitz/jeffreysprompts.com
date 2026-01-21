"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileWarning, Gavel, RefreshCw, Search, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface DmcaRequest {
  id: string;
  claimantName: string;
  claimantEmail: string;
  claimantAddress: string;
  copyrightedWorkDescription: string;
  copyrightedWorkUrl?: string | null;
  infringingContentUrl: string;
  status: "pending" | "removed" | "counter_pending" | "restored" | "dismissed";
  createdAt: string;
  updatedAt: string;
  counterNoticeAt?: string | null;
  counterNoticeContent?: string | null;
  counterName?: string | null;
  counterEmail?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolution?: string | null;
  reviewNotes?: string | null;
  strikeId?: string | null;
}

interface DmcaResponse {
  requests: DmcaRequest[];
  stats: Record<string, number>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_LABELS: Record<DmcaRequest["status"], string> = {
  pending: "Pending",
  removed: "Removed",
  counter_pending: "Counter notice",
  restored: "Restored",
  dismissed: "Dismissed",
};

const STATUS_BADGES: Record<DmcaRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  removed: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  counter_pending: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  restored: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  dismissed: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDmcaPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [requests, setRequests] = useState<DmcaRequest[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        status: filters.status,
        search: filters.search,
      });
      const response = await fetch(`/api/dmca?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as DmcaResponse & { error?: string } | null;

      if (!response.ok) {
        setRequests([]);
        setStats({});
        setLoadError(payload?.error ?? "Unable to load DMCA requests.");
        return;
      }

      setRequests(payload?.requests ?? []);
      setStats(payload?.stats ?? {});
    } catch {
      setRequests([]);
      setStats({});
      setLoadError("Unable to load DMCA requests.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const totals = useMemo(() => {
    return {
      pending: stats.pending ?? 0,
      removed: stats.removed ?? 0,
      counter: stats.counter_pending ?? 0,
      restored: stats.restored ?? 0,
    };
  }, [stats]);

  const updateRequest = useCallback(
    async (requestId: string, status: DmcaRequest["status"]) => {
      try {
        const response = await fetch("/api/dmca", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, status }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; request?: DmcaRequest }
          | null;

        if (!response.ok) {
          toastError(payload?.error ?? "Unable to update DMCA request.");
          return;
        }

        toastSuccess("DMCA request updated.");
        setRequests((prev) =>
          prev.map((item) => (item.id === requestId ? (payload?.request ?? item) : item))
        );
        loadRequests();
      } catch {
        toastError("Unable to update DMCA request.");
      }
    },
    [loadRequests, toastError, toastSuccess]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          DMCA requests
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Review takedown notices, track counter-notices, and resolve claims.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-foreground">{totals.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Removed</p>
              <p className="text-2xl font-semibold text-foreground">{totals.removed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Counter notices</p>
              <p className="text-2xl font-semibold text-foreground">{totals.counter}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restored</p>
              <p className="text-2xl font-semibold text-foreground">{totals.restored}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="search"
              placeholder="Search by claimant, email, or URL..."
              className="pl-10"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="removed">Removed</option>
              <option value="counter_pending">Counter notice</option>
              <option value="restored">Restored</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadError && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{loadError}</p>
            <div>
              <Button size="sm" onClick={loadRequests}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      <Gavel className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {request.claimantName}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {request.claimantEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <Badge className={STATUS_BADGES[request.status]}>
                      {STATUS_LABELS[request.status]}
                    </Badge>
                    {request.counterNoticeAt && (
                      <Badge variant="outline" className="border-indigo-300 text-indigo-600">
                        Counter notice received
                      </Badge>
                    )}
                    {request.strikeId && (
                      <Badge variant="outline" className="border-rose-300 text-rose-600">
                        Strike issued
                      </Badge>
                    )}
                    <span>Submitted {formatDate(request.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequest(request.id, "removed")}
                      >
                        Remove content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequest(request.id, "dismissed")}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                  {(request.status === "removed" || request.status === "counter_pending") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequest(request.id, "restored")}
                      >
                        Restore content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequest(request.id, "dismissed")}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">
                    Infringing URL:
                  </span>{" "}
                  <a
                    href={request.infringingContentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-amber-300 underline-offset-4"
                  >
                    {request.infringingContentUrl}
                  </a>
                </div>
                {request.copyrightedWorkUrl && (
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-200">
                      Original work:
                    </span>{" "}
                    <a
                      href={request.copyrightedWorkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-amber-300 underline-offset-4"
                    >
                      {request.copyrightedWorkUrl}
                    </a>
                  </div>
                )}
                <div>
                  <span className="font-medium text-neutral-900 dark:text-neutral-200">
                    Description:
                  </span>{" "}
                  {request.copyrightedWorkDescription}
                </div>
                {request.counterNoticeContent && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                    <p className="font-medium">Counter notice</p>
                    <p className="mt-1">{request.counterNoticeContent}</p>
                    {request.counterName && (
                      <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">
                        Filed by {request.counterName}{request.counterEmail ? ` (${request.counterEmail})` : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && requests.length === 0 && !loadError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              No DMCA requests
            </h3>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              New takedown notices will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
