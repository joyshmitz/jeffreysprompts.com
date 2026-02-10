/**
 * Unit tests for web vitals thresholds and metrics
 * Tests constant definitions and pure utility functions.
 */

import { describe, it, expect } from "vitest";
import { WEB_VITAL_THRESHOLDS, getPerformanceMetrics } from "./web-vitals";
import type { WebVitalName } from "./web-vitals";

describe("WEB_VITAL_THRESHOLDS", () => {
  it("defines thresholds for all 5 core web vitals", () => {
    const expected: WebVitalName[] = ["CLS", "FCP", "INP", "LCP", "TTFB"];
    for (const metric of expected) {
      expect(WEB_VITAL_THRESHOLDS[metric]).toBeDefined();
    }
  });

  it("each threshold has good and poor values", () => {
    for (const [, threshold] of Object.entries(WEB_VITAL_THRESHOLDS)) {
      expect(typeof threshold.good).toBe("number");
      expect(typeof threshold.poor).toBe("number");
    }
  });

  it("good threshold is always less than poor threshold", () => {
    for (const [, threshold] of Object.entries(WEB_VITAL_THRESHOLDS)) {
      expect(threshold.good).toBeLessThan(threshold.poor);
    }
  });

  it("LCP good is 2500ms", () => {
    expect(WEB_VITAL_THRESHOLDS.LCP.good).toBe(2500);
  });

  it("CLS good is 0.1", () => {
    expect(WEB_VITAL_THRESHOLDS.CLS.good).toBe(0.1);
  });

  it("INP good is 200ms", () => {
    expect(WEB_VITAL_THRESHOLDS.INP.good).toBe(200);
  });

  it("TTFB good is 800ms", () => {
    expect(WEB_VITAL_THRESHOLDS.TTFB.good).toBe(800);
  });

  it("FCP good is 1800ms", () => {
    expect(WEB_VITAL_THRESHOLDS.FCP.good).toBe(1800);
  });
});

describe("getPerformanceMetrics", () => {
  it("returns null or a metrics object", () => {
    const metrics = getPerformanceMetrics();
    // In happy-dom, performance API may not have navigation entries
    expect(metrics === null || typeof metrics === "object").toBe(true);
  });

  it("returns null when no navigation entries exist", () => {
    // happy-dom doesn't populate navigation timing
    const metrics = getPerformanceMetrics();
    expect(metrics).toBeNull();
  });
});
