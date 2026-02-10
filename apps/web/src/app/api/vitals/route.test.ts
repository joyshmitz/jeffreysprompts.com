/**
 * Tests for /api/vitals (GET, POST)
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

describe("/api/vitals", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("returns healthy status with metric names", async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("healthy");
      expect(data.metrics).toContain("CLS");
      expect(data.metrics).toContain("LCP");
      expect(data.metrics).toContain("TTFB");
    });
  });

  describe("POST", () => {
    it("accepts valid web vital payload", async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({
            name: "LCP",
            value: 2500,
            rating: "good",
            delta: 100,
            id: "v1-123",
            navigationType: "navigate",
          }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(202);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("returns 400 for invalid metric name", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({ name: "INVALID", value: 100, rating: "good" }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for non-numeric value", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({ name: "CLS", value: "not-a-number", rating: "good" }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for NaN value", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({ name: "CLS", value: NaN, rating: "good" }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid rating", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({ name: "FCP", value: 1000, rating: "excellent" }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: "not json",
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(400);
    });

    it("defaults delta and navigationType when missing", async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const res = await POST(
        new NextRequest("http://localhost/api/vitals", {
          method: "POST",
          body: JSON.stringify({
            name: "INP",
            value: 200,
            rating: "needs-improvement",
          }),
          headers: { "content-type": "application/json" },
        })
      );
      expect(res.status).toBe(202);
    });
  });
});
