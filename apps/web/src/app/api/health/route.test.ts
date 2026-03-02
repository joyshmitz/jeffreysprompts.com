/**
 * Unit tests for /api/health route (GET)
 * @module api/health/route.test
 *
 * Uses real registry data via submodule import, injected through vi.mock
 * to avoid zod import chain from the barrel module.
 */

import { describe, it, expect, vi } from "vitest";
import { prompts, categories, tags } from "@jeffreysprompts/core/prompts/registry";
import { GET } from "./route";

// Provide real registry data for the barrel import used by the route handler
vi.mock("@jeffreysprompts/core/prompts", async () => {
  const registry = await vi.importActual<typeof import("@jeffreysprompts/core/prompts/registry")>(
    "@jeffreysprompts/core/prompts/registry"
  );
  return registry;
});

describe("/api/health GET", () => {
  it("returns 200 with ok status", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("includes prompt counts from real registry", async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.prompts.count).toBe(prompts.length);
    expect(data.prompts.categories).toBe(categories.length);
    expect(data.prompts.tags).toBe(tags.length);
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
