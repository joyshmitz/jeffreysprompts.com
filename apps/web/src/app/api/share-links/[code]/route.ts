import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "@jeffreysprompts/core/prompts";
import { getBundle } from "@jeffreysprompts/core/prompts/bundles";
import { getWorkflow } from "@jeffreysprompts/core/prompts/workflows";
import {
  getShareLinkByCode,
  recordShareLinkView,
  revokeShareLink,
  updateShareLinkSettings,
  verifyPassword,
} from "@/lib/share-links/share-link-store";

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

export async function GET(
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

  if (link.expiresAt) {
    const expiry = new Date(link.expiresAt);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return NextResponse.json({ error: "Share link expired." }, { status: 410 });
    }
  }

  const password = request.nextUrl.searchParams.get("password") ?? "";
  if (link.passwordHash) {
    if (!password) {
      return NextResponse.json({ error: "Password required." }, { status: 401 });
    }
    if (!verifyPassword(password, link.passwordHash)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
  }

  let content: unknown = null;
  switch (link.contentType) {
    case "prompt":
      content = getPrompt(link.contentId) ?? null;
      break;
    case "bundle":
      content = getBundle(link.contentId) ?? null;
      break;
    case "workflow":
      content = getWorkflow(link.contentId) ?? null;
      break;
    default:
      content = null;
  }

  if (!content) {
    return NextResponse.json({ error: "Shared content not found." }, { status: 404 });
  }

  recordShareLinkView({
    linkId: link.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    success: true,
    link: {
      id: link.id,
      code: link.linkCode,
      contentType: link.contentType,
      contentId: link.contentId,
      viewCount: link.viewCount,
      createdAt: link.createdAt,
    },
    content,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing share code." }, { status: 400 });
  }

  const link = getShareLinkByCode(code);
  if (!link) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }

  const revoked = revokeShareLink(code);
  if (!revoked) {
    return NextResponse.json({ error: "Failed to revoke share link." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Share link revoked.",
    link: {
      id: revoked.id,
      code: revoked.linkCode,
      isActive: revoked.isActive,
    },
  });
}

const MAX_PASSWORD_LENGTH = 64;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing share code." }, { status: 400 });
  }

  const link = getShareLinkByCode(code);
  if (!link) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }

  if (!link.isActive) {
    return NextResponse.json({ error: "Cannot update revoked share link." }, { status: 410 });
  }

  let payload: {
    password?: string | null;
    expiresAt?: string | null;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    payload.password !== undefined &&
    payload.password !== null &&
    payload.password.length > MAX_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      { error: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  if (payload.expiresAt !== undefined && payload.expiresAt !== null) {
    const expiry = new Date(payload.expiresAt);
    if (Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: "Invalid expiresAt date." }, { status: 400 });
    }
  }

  const updated = updateShareLinkSettings({
    code,
    password: payload.password,
    expiresAt: payload.expiresAt,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update share link." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    link: {
      id: updated.id,
      code: updated.linkCode,
      contentType: updated.contentType,
      contentId: updated.contentId,
      expiresAt: updated.expiresAt,
      isActive: updated.isActive,
      viewCount: updated.viewCount,
      createdAt: updated.createdAt,
      url: `https://jeffreysprompts.com/share/${updated.linkCode}`,
    },
  });
}
