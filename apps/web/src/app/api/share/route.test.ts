/**
 * Unit tests for /api/share route (POST)
 * @module api/share/route.test
 *
 * Uses real core/prompts, bundles, and workflows via submodule imports.
 * vi.mock redirects barrel imports to avoid zod import chain.
 * Only share-link-store, user-id, and rate-limit are mocked (internal state).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { prompts } from "@jeffreysprompts/core/prompts/registry";
import { bundles } from "@jeffreysprompts/core/prompts/bundles";
import { workflows } from "@jeffreysprompts/core/prompts/workflows";
import { POST } from "./route";

// Use real IDs from the registry
const REAL_PROMPT_ID = prompts[0].id;
const REAL_BUNDLE_ID = bundles[0]?.id ?? "getting-started";
const REAL_WORKFLOW_ID = workflows[0]?.id ?? "new-feature";

// Provide real registry data for the barrel imports used by the route handler
vi.mock("@jeffreysprompts/core/prompts", async () => {
  const registry = await vi.importActual<typeof import("@jeffreysprompts/core/prompts/registry")>(
    "@jeffreysprompts/core/prompts/registry"
  );
  return registry;
});

vi.mock("@jeffreysprompts/core/prompts/bundles", async () => {
  return vi.importActual("@jeffreysprompts/core/prompts/bundles");
});

vi.mock("@jeffreysprompts/core/prompts/workflows", async () => {
  return vi.importActual("@jeffreysprompts/core/prompts/workflows");
});

const mockCreateShareLink = vi.fn();

vi.mock("@/lib/share-links/share-link-store", () => ({
  createShareLink: (...args: unknown[]) => mockCreateShareLink(...args),
}));

vi.mock("@/lib/user-id", () => ({
  getOrCreateUserId: () => ({
    userId: "test-user-123",
    cookie: null,
  }),
}));

vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => ({
    check: () => ({ allowed: true }),
  }),
  getTrustedClientIp: () => "127.0.0.1",
}));

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/share POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateShareLink.mockReturnValue({
      linkCode: "abc123XYZ789",
      expiresAt: null,
    });
  });

  it("creates a share link for a valid prompt", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.linkCode).toBe("abc123XYZ789");
    expect(data.url).toContain("share/abc123XYZ789");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Missing");
  });

  it("returns 400 for invalid content type", async () => {
    const res = await POST(makeRequest({
      contentType: "invalid_type",
      contentId: REAL_PROMPT_ID,
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Invalid content type");
  });

  it("returns 404 for non-existent content", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: "does-not-exist",
    }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  it("returns 400 for password too long", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      password: "a".repeat(65),
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("Password");
  });

  it("accepts valid password", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      password: "secret123",
    }));

    expect(res.status).toBe(200);
    expect(mockCreateShareLink).toHaveBeenCalledWith(
      expect.objectContaining({ password: "secret123" })
    );
  });

  it("maps user_prompt type to prompt", async () => {
    const res = await POST(makeRequest({
      contentType: "user_prompt",
      contentId: REAL_PROMPT_ID,
    }));

    expect(res.status).toBe(200);
    expect(mockCreateShareLink).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "prompt" })
    );
  });

  it("returns 400 for invalid expiration", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      expiresIn: "not-a-number",
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("expiration");
  });

  it("returns 400 for expiration too far in the future", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      expiresIn: 400,
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("365 days");
  });

  it("accepts valid expiresIn", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      expiresIn: 7,
    }));

    expect(res.status).toBe(200);
    expect(mockCreateShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        expiresAt: expect.any(String),
      })
    );
  });

  it("returns 400 for invalid password type", async () => {
    const res = await POST(makeRequest({
      contentType: "prompt",
      contentId: REAL_PROMPT_ID,
      password: 12345,
    }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("password");
  });

  it("creates share link for a bundle", async () => {
    const res = await POST(makeRequest({
      contentType: "bundle",
      contentId: REAL_BUNDLE_ID,
    }));

    expect(res.status).toBe(200);
    expect(mockCreateShareLink).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "bundle", contentId: REAL_BUNDLE_ID })
    );
  });

  it("creates share link for a workflow", async () => {
    const res = await POST(makeRequest({
      contentType: "workflow",
      contentId: REAL_WORKFLOW_ID,
    }));

    expect(res.status).toBe(200);
    expect(mockCreateShareLink).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "workflow", contentId: REAL_WORKFLOW_ID })
    );
  });
});
