import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createRateLimiter, checkMultipleLimits } from "./rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createRateLimiter", () => {
    it("allows requests within the limit", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 3,
      });

      const r1 = await limiter.check("ip-1");
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = await limiter.check("ip-1");
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await limiter.check("ip-1");
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it("denies requests exceeding the limit", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 2,
      });

      await limiter.check("ip-1");
      await limiter.check("ip-1");
      const r3 = await limiter.check("ip-1");

      expect(r3.allowed).toBe(false);
      expect(r3.remaining).toBe(0);
      expect(r3.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("tracks different keys independently", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 1,
      });

      const r1 = await limiter.check("ip-1");
      expect(r1.allowed).toBe(true);

      const r2 = await limiter.check("ip-2");
      expect(r2.allowed).toBe(true);

      const r3 = await limiter.check("ip-1");
      expect(r3.allowed).toBe(false);
    });

    it("resets after the window expires", async () => {
      const limiter = createRateLimiter({
        windowMs: 10_000,
        maxRequests: 1,
      });

      const r1 = await limiter.check("ip-1");
      expect(r1.allowed).toBe(true);

      const r2 = await limiter.check("ip-1");
      expect(r2.allowed).toBe(false);

      // Advance past the window
      vi.advanceTimersByTime(11_000);

      const r3 = await limiter.check("ip-1");
      expect(r3.allowed).toBe(true);
    });

    it("provides accurate retryAfterSeconds", async () => {
      const limiter = createRateLimiter({
        windowMs: 30_000,
        maxRequests: 1,
      });

      await limiter.check("ip-1");
      const denied = await limiter.check("ip-1");

      expect(denied.allowed).toBe(false);
      expect(denied.retryAfterSeconds).toBeGreaterThanOrEqual(1);
      expect(denied.retryAfterSeconds).toBeLessThanOrEqual(30);
    });

    it("evicts oldest active buckets when maxBuckets is reached", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 1,
        maxBuckets: 2,
      });

      await limiter.check("ip-1");
      await limiter.check("ip-2");

      // This adds a third distinct key and should evict the oldest (ip-1).
      await limiter.check("ip-3");

      const ip1 = await limiter.check("ip-1");
      expect(ip1.allowed).toBe(true);
      expect(ip1.remaining).toBe(0);
    });

    it("prefers removing expired buckets before evicting active ones", async () => {
      const limiter = createRateLimiter({
        windowMs: 1_000,
        maxRequests: 2,
        maxBuckets: 2,
      });

      await limiter.check("ip-1");
      await limiter.check("ip-2");
      vi.advanceTimersByTime(1_100);

      // At capacity, but both existing buckets are expired and should be cleared first.
      await limiter.check("ip-3");
      const ip1 = await limiter.check("ip-1");
      expect(ip1.allowed).toBe(true);
      expect(ip1.remaining).toBe(1);
    });
  });

  describe("peek", () => {
    it("does not increment the counter", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 2,
      });

      await limiter.check("ip-1"); // count = 1

      const peek1 = await limiter.peek("ip-1");
      expect(peek1.remaining).toBe(1);

      const peek2 = await limiter.peek("ip-1");
      expect(peek2.remaining).toBe(1); // Still 1, not decremented

      const r = await limiter.check("ip-1"); // count = 2
      expect(r.remaining).toBe(0);
    });

    it("returns full allowance for unknown keys", async () => {
      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 5,
      });

      const result = await limiter.peek("unknown-ip");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  describe("checkMultipleLimits", () => {
    it("returns allowed when all limiters allow", async () => {
      const limiter1 = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });
      const limiter2 = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

      const result = await checkMultipleLimits([
        { limiter: limiter1, key: "ip-1" },
        { limiter: limiter2, key: "email-1" },
      ]);

      expect(result.allowed).toBe(true);
    });

    it("returns denied if any limiter denies", async () => {
      const strict = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
      const lenient = createRateLimiter({ windowMs: 60_000, maxRequests: 100 });

      // Exhaust the strict limiter
      await strict.check("ip-1");

      const result = await checkMultipleLimits([
        { limiter: strict, key: "ip-1" },
        { limiter: lenient, key: "email-1" },
      ]);

      expect(result.allowed).toBe(false);
    });

    it("returns allowed for empty checks array", async () => {
      const result = await checkMultipleLimits([]);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it("returns the most restrictive remaining when all allow", async () => {
      const small = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
      const large = createRateLimiter({ windowMs: 60_000, maxRequests: 100 });

      const result = await checkMultipleLimits([
        { limiter: small, key: "ip-1" },
        { limiter: large, key: "email-1" },
      ]);

      expect(result.remaining).toBe(2); // small has 2 remaining (3 - 1)
    });
  });
});
