import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Ban,
  Shield,
  FileWarning,
  CheckCircle,
  XCircle,
  History,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getUserModerationHistory,
  getModerationStats,
  getModerationReasonLabel,
  getActionTypeLabel,
  checkUserStatus,
  ACTION_TYPES,
  MODERATION_REASONS,
  type ModerationAction,
} from "@/lib/moderation/action-store";

export const metadata: Metadata = {
  title: "Moderate User | Admin",
  description: "Apply moderation actions to a user account.",
};

interface ModerateUserPageProps {
  params: Promise<{ id: string }>;
}

// Mock user lookup - in production this would fetch from API/DB
function getMockUser(id: string) {
  const mockUsers: Record<string, { id: string; email: string; name: string; tier: string; joinedAt: string }> = {
    "1": { id: "1", email: "alice@example.com", name: "Alice Johnson", tier: "premium", joinedAt: "2024-11-15" },
    "2": { id: "2", email: "bob@example.com", name: "Bob Smith", tier: "free", joinedAt: "2024-12-01" },
    "3": { id: "3", email: "charlie@example.com", name: "Charlie Brown", tier: "premium", joinedAt: "2025-01-02" },
    "4": { id: "4", email: "dave@example.com", name: "Dave Wilson", tier: "free", joinedAt: "2024-10-20" },
    "5": { id: "5", email: "eve@example.com", name: "Eve Martinez", tier: "premium", joinedAt: "2025-01-10" },
  };
  return mockUsers[id] ?? { id, email: "unknown@example.com", name: "Unknown User", tier: "free", joinedAt: "Unknown" };
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionIcon(actionType: string) {
  switch (actionType) {
    case "warning":
      return <FileWarning className="h-4 w-4" />;
    case "suspension":
      return <Clock className="h-4 w-4" />;
    case "indefinite_suspension":
      return <AlertTriangle className="h-4 w-4" />;
    case "ban":
      return <Ban className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getActionColor(actionType: string) {
  switch (actionType) {
    case "warning":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    case "suspension":
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400";
    case "indefinite_suspension":
      return "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400";
    case "ban":
      return "bg-red-200 text-red-700 dark:bg-red-500/30 dark:text-red-300";
    default:
      return "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300";
  }
}

export default async function ModerateUserPage({ params }: ModerateUserPageProps) {
  const { id: userId } = await params;
  const user = getMockUser(userId);
  const userStatus = checkUserStatus(userId);
  const history = getUserModerationHistory(userId);
  const stats = getModerationStats();

  const isActive = userStatus.status === "active";
  const isBanned = userStatus.status === "banned";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* User header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-xl font-medium text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">{user.tier}</Badge>
              <Badge
                variant="secondary"
                className={
                  isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : isBanned
                      ? "bg-red-200 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                }
              >
                {userStatus.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/user/${userId}`}>
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Current status alert */}
      {!isActive && (
        <Card className={isBanned ? "border-red-300 dark:border-red-500/50" : "border-orange-300 dark:border-orange-500/50"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${isBanned ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"}`}>
                {isBanned ? <Ban className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {isBanned ? "User is Permanently Banned" : "User is Currently Suspended"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {userStatus.reason && `Reason: ${getModerationReasonLabel(userStatus.reason)}`}
                  {userStatus.endsAt && ` • Ends: ${formatDate(userStatus.endsAt)}`}
                </p>
                {!isBanned && (
                  <Button variant="outline" size="sm" className="mt-3">
                    <Shield className="mr-2 h-4 w-4 text-emerald-500" />
                    Lift Suspension
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Take action card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Take Moderation Action
            </CardTitle>
            <CardDescription>
              Apply warnings, suspensions, or bans to this user account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action type selector */}
            <div>
              <label className="text-sm font-medium text-foreground">Action Type</label>
              <div className="mt-2 grid gap-2">
                {ACTION_TYPES.map((action) => (
                  <label
                    key={action.value}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name="actionType"
                      value={action.value}
                      className="h-4 w-4"
                      disabled={isBanned}
                    />
                    <div className={`rounded p-1.5 ${getActionColor(action.value)}`}>
                      {getActionIcon(action.value)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Severity: {action.severity}/4
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason selector */}
            <div>
              <label className="text-sm font-medium text-foreground">Reason</label>
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                disabled={isBanned}
              >
                <option value="">Select a reason...</option>
                {MODERATION_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration (for temporary suspension) */}
            <div>
              <label className="text-sm font-medium text-foreground">Duration (for temporary suspension)</label>
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                disabled={isBanned}
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            {/* Details */}
            <div>
              <label className="text-sm font-medium text-foreground">Details (visible to user)</label>
              <textarea
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Explain the reason for this action..."
                disabled={isBanned}
              />
            </div>

            {/* Internal notes */}
            <div>
              <label className="text-sm font-medium text-foreground">Internal Notes (admin only)</label>
              <textarea
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="Notes for other admins..."
                disabled={isBanned}
              />
            </div>

            {/* Submit button */}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={isBanned}>
                Apply Action
              </Button>
            </div>

            {isBanned && (
              <p className="text-xs text-muted-foreground text-center">
                This user is permanently banned. No further actions can be taken.
              </p>
            )}
          </CardContent>
        </Card>

        {/* History card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Moderation History
            </CardTitle>
            <CardDescription>
              Previous actions taken on this account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
                <p className="font-medium text-foreground">Clean Record</p>
                <p className="text-sm text-muted-foreground">
                  No previous moderation actions on this account.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((action) => (
                  <HistoryItem key={action.id} action={action} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Moderation Overview</CardTitle>
          <CardDescription>
            Summary of all moderation actions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Actions" value={stats.totalActions} icon={History} variant="default" />
            <StatCard label="Active Actions" value={stats.activeActions} icon={AlertTriangle} variant="warning" />
            <StatCard label="Warnings" value={stats.byType.warning} icon={FileWarning} variant="amber" />
            <StatCard label="Bans" value={stats.byType.ban} icon={Ban} variant="danger" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryItem({ action }: { action: ModerationAction }) {
  const isReversed = Boolean(action.reversedAt);

  return (
    <div className={`rounded-lg border p-4 ${isReversed ? "border-dashed opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${getActionColor(action.actionType)}`}>
          {getActionIcon(action.actionType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {getActionTypeLabel(action.actionType)}
            </span>
            {isReversed && (
              <Badge variant="outline" className="text-xs">
                <XCircle className="mr-1 h-3 w-3" />
                Reversed
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getModerationReasonLabel(action.reason)}
          </p>
          {action.details && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              &quot;{action.details}&quot;
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>{formatDate(action.createdAt)}</span>
            {action.endsAt && <span>Ends: {formatDate(action.endsAt)}</span>}
            {isReversed && action.reversedAt && (
              <span>Reversed: {formatDate(action.reversedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "amber" | "danger";
}) {
  const colors = {
    default: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    warning: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    danger: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
      <div className={`rounded-lg p-2 ${colors[variant]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
