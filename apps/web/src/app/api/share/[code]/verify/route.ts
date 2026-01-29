import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "@jeffreysprompts/core/prompts";
import { getBundle } from "@jeffreysprompts/core/prompts/bundles";
import { getWorkflow } from "@jeffreysprompts/core/prompts/workflows";
import {
  getShareLinkByCode,
  recordShareLinkView,
  verifyPassword,
} from "@/lib/share-links/share-link-store";

const MAX_PASSWORD_LENGTH = 64;

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

function resolveContent(contentType: string, contentId: string): unknown | null {
  switch (contentType) {
    case "prompt":
      return getPrompt(contentId) ?? null;
    case "bundle":
      return getBundle(contentId) ?? null;
    case "workflow":
      return getWorkflow(contentId) ?? null;
    default:
      return null;
  }
}

function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing share code." }, { status: 400 });
  }

  const link = getShareLinkByCode(code);
  if (!link || !link.isActive) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }

  if (isExpired(link.expiresAt)) {
    return NextResponse.json({ error: "Share link expired." }, { status: 410 });
  }

  let payload: { password?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const password = payload.password?.trim() ?? "";

  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  if (!link.passwordHash) {
    return NextResponse.json({ error: "This share link is not password protected." }, { status: 400 });
  }

  if (!verifyPassword(password, link.passwordHash)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const content = resolveContent(link.contentType, link.contentId);
  if (!content) {
    return NextResponse.json({ error: "Shared content not found." }, { status: 404 });
  }

  recordShareLinkView({
    linkId: link.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    link: {
      code: link.linkCode,
      contentType: link.contentType,
      contentId: link.contentId,
      viewCount: link.viewCount,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
    content,
  });
}
