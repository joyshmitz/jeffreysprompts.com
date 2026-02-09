/**
 * Unit tests for /api/health route (GET)
 * @module api/health/route.test
 */

import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

vi.mock("@jeffreysprompts/core/prompts", () => ({
  prompts: [
    { id: "p1", title: "Prompt A" },
    { id: "p2", title: "Prompt B" },
  ],
  categories: ["ideation", "documentation"],
  tags: ["brainstorming", "ultrathink", "refactor"],
}));

describe("/api/health GET", () => {
  it("returns 200 with ok status", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("includes prompt counts", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.prompts.count).toBe(2);
    expect(data.prompts.categories).toBe(2);
    expect(data.prompts.tags).toBe(3);
  });

  it("includes timestamp", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.timestamp).toBeTruthy();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("includes version", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.version).toBeTruthy();
  });

  it("includes environment", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.environment).toBeTruthy();
  });

  it("sets no-cache headers", async () => {
    const res = await GET();

    expect(res.headers.get("Cache-Control")).toContain("no-cache");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Cache-Control")).toContain("must-revalidate");
  });
});
