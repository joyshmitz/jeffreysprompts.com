import { NextResponse, type NextRequest } from "next/server";
import { checkAdminPermission } from "@/lib/admin/permissions";
import {
  getFeature,
  updateFeatureStatus,
  type FeatureStatus,
} from "@/lib/roadmap/roadmap-store";

const VALID_STATUSES: FeatureStatus[] = [
  "under_review",
  "planned",
  "in_progress",
  "shipped",
  "declined",
];
const ADMIN_HEADERS = { "Cache-Control": "no-store" };

function isValidStatus(value: unknown): value is FeatureStatus {
  return typeof value === "string" && VALID_STATUSES.includes(value as FeatureStatus);
}

/**
 * GET /api/admin/roadmap/[id]
 *
 * Get a single feature request for admin view.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = checkAdminPermission(request, "content.view_reported");
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: auth.reason ?? "forbidden" }, { status });
  }

  const { id } = await context.params;
  const feature = getFeature(id);

  if (!feature) {
    return NextResponse.json(
      { error: "not_found", message: "Feature not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    feature,
    adminRole: auth.role,
  }, { headers: ADMIN_HEADERS });
}

/**
 * PATCH /api/admin/roadmap/[id]
 *
 * Update a feature request's status (admin only).
 *
 * Body:
 * - status: FeatureStatus (required)
 * - statusNote: string (optional)
 * - plannedQuarter: string (optional)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = checkAdminPermission(request, "content.moderate");
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json({ error: auth.reason ?? "forbidden" }, { status });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { status, statusNote, plannedQuarter } = body;

    if (!status) {
      return NextResponse.json(
        { error: "missing_status", message: "Status is required" },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          error: "invalid_status",
          message: `Invalid status: ${status}. Valid statuses are: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const feature = updateFeatureStatus(id, status, {
      statusNote: statusNote ?? undefined,
      plannedQuarter: plannedQuarter ?? undefined,
    });

    if (!feature) {
      return NextResponse.json(
        { error: "not_found", message: "Feature not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feature,
      message: `Feature status updated to ${status}`,
    }, { headers: ADMIN_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
