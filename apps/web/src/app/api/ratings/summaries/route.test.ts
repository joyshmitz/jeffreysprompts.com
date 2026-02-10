/**
 * Tests for GET /api/ratings/summaries
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(params = ""): NextRequest {
  const url = `http://localhost/api/ratings/summaries${params ? `?${params}` : ""}`;
  return new NextRequest(url);
}

describe("GET /api/ratings/summaries", () => {
  it("returns summaries object and generated_at", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.summaries).toBe("object");
    expect(data.generated_at).toBeDefined();
  });

  it("defaults to prompt content type", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it("accepts explicit contentType=prompt", async () => {
    const res = await GET(makeRequest("contentType=prompt"));
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid content type", async () => {
    const res = await GET(makeRequest("contentType=invalid"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid");
  });

  it("sets cache headers", async () => {
    const res = await GET(makeRequest());
    const cacheControl = res.headers.get("cache-control");
    expect(cacheControl).toContain("s-maxage=30");
  });
});
