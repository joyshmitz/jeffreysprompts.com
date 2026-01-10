import { NextRequest, NextResponse } from "next/server";
import { buildRegistryPayload, buildPromptList } from "@jeffreysprompts/core/export";
import { prompts, categories, tags } from "@jeffreysprompts/core/prompts";

// Version for ETag generation
const REGISTRY_VERSION = process.env.JFP_REGISTRY_VERSION ?? "1.0.0";

// Generate ETag from registry version and prompt count
function generateETag(): string {
  const content = `${REGISTRY_VERSION}-${prompts.length}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Filter parameters
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const featured = searchParams.get("featured");
  const minimal = searchParams.get("minimal");

  // Check ETag for 304 response
  const etag = generateETag();
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  // Build response data
  let data: unknown;

  if (minimal === "true") {
    // Minimal list for search/autocomplete
    let filtered = buildPromptList();

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    if (tag) {
      filtered = filtered.filter((p) => p.tags.includes(tag));
    }

    data = {
      prompts: filtered,
      meta: {
        count: filtered.length,
        categories: categories as string[],
        tags,
      },
    };
  } else {
    // Full registry
    const payload = buildRegistryPayload(REGISTRY_VERSION);

    // Apply filters if specified
    if (category || tag || featured) {
      payload.prompts = payload.prompts.filter((p) => {
        if (category && p.category !== category) return false;
        if (tag && !p.tags.includes(tag)) return false;
        if (featured === "true" && !p.featured) return false;
        return true;
      });
      payload.meta.promptCount = payload.prompts.length;
    }

    data = payload;
  }

  return NextResponse.json(data, {
    headers: {
      "ETag": etag,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Vary": "Accept-Encoding",
    },
  });
}
