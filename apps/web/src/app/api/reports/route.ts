import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REPORT_REASONS = new Set([
  "spam",
  "offensive",
  "copyright",
  "harmful",
  "other",
]);
const CONTENT_TYPES = new Set([
  "prompt",
  "bundle",
  "workflow",
  "collection",
]);

const MAX_DETAILS_LENGTH = 500;
const MAX_REPORTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return ip;
}

function getRateLimitBucket(key: string, now: number) {
  const existing = rateLimitBuckets.get(key);
  if (!existing || now > existing.resetAt) {
    const bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitBuckets.set(key, bucket);
    return bucket;
  }
  return existing;
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const key = getClientKey(request);
  const bucket = getRateLimitBucket(key, now);
  bucket.count += 1;

  if (bucket.count > MAX_REPORTS_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Report limit reached. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": retryAfterSeconds.toString() },
      }
    );
  }

  let payload: {
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
    reason?: string;
    details?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { contentType, contentId, contentTitle, reason, details } = payload ?? {};

  if (!contentType || !contentId || !reason) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  if (!REPORT_REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid reason value." }, { status: 400 });
  }

  const normalizedDetails = details?.trim();
  if (normalizedDetails && normalizedDetails.length > MAX_DETAILS_LENGTH) {
    return NextResponse.json(
      { error: "Details must be 500 characters or fewer." },
      { status: 400 }
    );
  }

  const reportId = crypto.randomUUID();

  return NextResponse.json({
    success: true,
    reportId,
    content: {
      type: contentType,
      id: contentId,
      title: contentTitle ?? null,
    },
  });
}
