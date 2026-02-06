/**
 * Unit tests for status-service
 * @module lib/status/status-service.test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the health checks module before importing status-service
vi.mock("@/lib/health/checks", () => ({
  runReadyChecks: vi.fn(),
  runStatusChecks: vi.fn(),
}));

import {
  getStatusSummary,
  getQuickStatus,
  getComponentStatus,
} from "./status-service";
import { runReadyChecks, runStatusChecks } from "@/lib/health/checks";
import { createIncident, createMaintenance, updateMaintenanceStatus } from "./incident-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStores() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_incident_store__"];
}

function mockHealthyChecks() {
  (runStatusChecks as ReturnType<typeof vi.fn>).mockResolvedValue({
    checks: {
      web: { ok: true, durationMs: 50 },
      api: { ok: true, durationMs: 30 },
      registry: { ok: true, durationMs: 20 },
    },
  });
  (runReadyChecks as ReturnType<typeof vi.fn>).mockResolvedValue({
    status: "healthy",
    checks: {},
  });
}

function mockDegradedChecks() {
  (runStatusChecks as ReturnType<typeof vi.fn>).mockResolvedValue({
    checks: {
      web: { ok: true, durationMs: 50 },
      api: { ok: false, durationMs: 5000 },
      registry: { ok: true, durationMs: 20 },
    },
  });
  (runReadyChecks as ReturnType<typeof vi.fn>).mockResolvedValue({
    status: "degraded",
    checks: {},
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("status-service", () => {
  beforeEach(() => {
    clearStores();
    vi.clearAllMocks();
    mockHealthyChecks();
  });

  // -----------------------------------------------------------------------
  // getStatusSummary
  // -----------------------------------------------------------------------

  describe("getStatusSummary", () => {
    it("returns operational when everything is healthy", async () => {
      const summary = await getStatusSummary();
      expect(summary.status).toBe("operational");
      expect(summary.message).toBe("All systems operational");
      expect(summary.components).toHaveLength(3);
      expect(summary.activeIncidents).toHaveLength(0);
    });

    it("returns degraded when a health check fails", async () => {
      mockDegradedChecks();

      const summary = await getStatusSummary();
      expect(summary.status).toBe("degraded");
      expect(summary.message).toContain("issues");
    });

    it("reflects critical incident as major_outage", async () => {
      createIncident({
        title: "Database down",
        impact: "critical",
        message: "DB unreachable",
        affectedComponents: ["api"],
        createdBy: "admin",
      });

      const summary = await getStatusSummary();
      expect(summary.status).toBe("major_outage");
      expect(summary.activeIncidents).toHaveLength(1);
    });

    it("reflects major incident as partial_outage", async () => {
      createIncident({
        title: "API slow",
        impact: "major",
        message: "High latency",
        affectedComponents: ["api"],
        createdBy: "admin",
      });

      const summary = await getStatusSummary();
      expect(summary.status).toBe("partial_outage");
    });

    it("reflects minor incident as degraded", async () => {
      createIncident({
        title: "Minor issue",
        impact: "minor",
        message: "Slight delay",
        affectedComponents: ["web"],
        createdBy: "admin",
      });

      const summary = await getStatusSummary();
      expect(summary.status).toBe("degraded");
    });

    it("returns maintenance when components in maintenance", async () => {
      const m = createMaintenance({
        title: "Planned maintenance",
        scheduledStart: new Date(Date.now() - 3600000).toISOString(),
        scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
        affectedComponents: ["web"],
        createdBy: "admin",
      });
      updateMaintenanceStatus(m.id, "in_progress");

      const summary = await getStatusSummary();
      expect(summary.status).toBe("maintenance");
    });

    it("includes component latency", async () => {
      const summary = await getStatusSummary();
      const webComponent = summary.components.find((c) => c.name === "web");
      expect(webComponent?.latencyMs).toBe(50);
    });

    it("includes updatedAt timestamp", async () => {
      const summary = await getStatusSummary();
      expect(summary.updatedAt).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // getQuickStatus
  // -----------------------------------------------------------------------

  describe("getQuickStatus", () => {
    it("returns operational when healthy", async () => {
      const result = await getQuickStatus();
      expect(result.status).toBe("operational");
      expect(result.message).toBe("All systems operational");
    });

    it("returns degraded when health is degraded", async () => {
      mockDegradedChecks();
      const result = await getQuickStatus();
      expect(result.status).toBe("degraded");
    });

    it("returns major_outage for critical incident", async () => {
      createIncident({
        title: "Outage",
        impact: "critical",
        message: "Down",
        affectedComponents: ["api"],
        createdBy: "admin",
      });

      const result = await getQuickStatus();
      expect(result.status).toBe("major_outage");
    });

    it("returns partial_outage for major incident", async () => {
      createIncident({
        title: "Issue",
        impact: "major",
        message: "Slow",
        affectedComponents: ["api"],
        createdBy: "admin",
      });

      const result = await getQuickStatus();
      expect(result.status).toBe("partial_outage");
    });

    it("returns maintenance when active maintenance exists", async () => {
      const m = createMaintenance({
        title: "Maintenance",
        scheduledStart: new Date(Date.now() - 3600000).toISOString(),
        scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
        affectedComponents: ["web"],
        createdBy: "admin",
      });
      updateMaintenanceStatus(m.id, "in_progress");

      const result = await getQuickStatus();
      expect(result.status).toBe("maintenance");
    });
  });

  // -----------------------------------------------------------------------
  // getComponentStatus
  // -----------------------------------------------------------------------

  describe("getComponentStatus", () => {
    it("returns status for known component", async () => {
      const result = await getComponentStatus("web");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("web");
      expect(result?.displayName).toBe("Web Application");
      expect(result?.status).toBe("operational");
    });

    it("returns null for unknown component", async () => {
      const result = await getComponentStatus("nonexistent");
      expect(result).toBeNull();
    });

    it("returns degraded for unhealthy component", async () => {
      mockDegradedChecks();
      const result = await getComponentStatus("api");
      expect(result?.status).toBe("degraded");
    });
  });
});
