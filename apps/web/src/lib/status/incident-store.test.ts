/**
 * Unit tests for incident-store
 * @module lib/status/incident-store.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createIncident,
  getIncident,
  listIncidents,
  getActiveIncidents,
  getResolvedIncidents,
  addIncidentUpdate,
  updateIncidentImpact,
  createMaintenance,
  getMaintenance,
  listMaintenance,
  getUpcomingMaintenance,
  getActiveMaintenance,
  updateMaintenanceStatus,
  getIncidentStats,
} from "./incident-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearStore() {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g["__jfp_incident_store__"];
}

function seedIncident(overrides?: Record<string, unknown>) {
  return createIncident({
    title: "API Latency Increase",
    impact: "minor",
    affectedComponents: ["api"],
    message: "We are investigating increased latency.",
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("incident-store", () => {
  beforeEach(() => {
    clearStore();
  });

  // -----------------------------------------------------------------------
  // createIncident
  // -----------------------------------------------------------------------

  describe("createIncident", () => {
    it("creates an incident with correct fields", () => {
      const incident = createIncident({
        title: "Database Outage",
        impact: "critical",
        affectedComponents: ["database", "api"],
        message: "Database is down.",
      });

      expect(incident.id).toBeTruthy();
      expect(incident.title).toBe("Database Outage");
      expect(incident.status).toBe("investigating");
      expect(incident.impact).toBe("critical");
      expect(incident.affectedComponents).toEqual(["database", "api"]);
      expect(incident.updates).toHaveLength(1);
      expect(incident.updates[0].message).toBe("Database is down.");
      expect(incident.updates[0].status).toBe("investigating");
      expect(incident.resolvedAt).toBeNull();
      expect(incident.createdAt).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // getIncident
  // -----------------------------------------------------------------------

  describe("getIncident", () => {
    it("returns incident by ID", () => {
      const incident = seedIncident();
      expect(getIncident(incident.id)?.id).toBe(incident.id);
    });

    it("returns null for unknown ID", () => {
      expect(getIncident("nope")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // listIncidents
  // -----------------------------------------------------------------------

  describe("listIncidents", () => {
    it("returns all incidents", () => {
      seedIncident();
      seedIncident();
      expect(listIncidents()).toHaveLength(2);
    });

    it("filters by status", () => {
      const incident = seedIncident();
      seedIncident();
      addIncidentUpdate({
        incidentId: incident.id,
        status: "resolved",
        message: "Fixed.",
      });

      expect(listIncidents({ status: "resolved" })).toHaveLength(1);
      expect(listIncidents({ status: "investigating" })).toHaveLength(1);
    });

    it("returns all when status is 'all'", () => {
      seedIncident();
      const i2 = seedIncident();
      addIncidentUpdate({ incidentId: i2.id, status: "resolved", message: "Done." });

      expect(listIncidents({ status: "all" })).toHaveLength(2);
    });

    it("respects limit", () => {
      for (let i = 0; i < 5; i++) seedIncident();
      expect(listIncidents({ limit: 3 })).toHaveLength(3);
    });

    it("most recently touched is first", () => {
      const first = seedIncident({ title: "First" });
      seedIncident({ title: "Second" });
      // Touch first by adding an update
      addIncidentUpdate({ incidentId: first.id, status: "identified", message: "Found root cause." });

      const incidents = listIncidents();
      expect(incidents[0].title).toBe("First");
    });
  });

  // -----------------------------------------------------------------------
  // getActiveIncidents / getResolvedIncidents
  // -----------------------------------------------------------------------

  describe("getActiveIncidents", () => {
    it("returns only non-resolved incidents", () => {
      seedIncident();
      const resolved = seedIncident();
      addIncidentUpdate({ incidentId: resolved.id, status: "resolved", message: "Fixed." });

      const active = getActiveIncidents();
      expect(active).toHaveLength(1);
      expect(active[0].status).not.toBe("resolved");
    });
  });

  describe("getResolvedIncidents", () => {
    it("returns only resolved incidents", () => {
      seedIncident();
      const resolved = seedIncident();
      addIncidentUpdate({ incidentId: resolved.id, status: "resolved", message: "Fixed." });

      const list = getResolvedIncidents();
      expect(list).toHaveLength(1);
      expect(list[0].status).toBe("resolved");
    });

    it("returns empty when no resolved incidents", () => {
      seedIncident();
      expect(getResolvedIncidents()).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // addIncidentUpdate
  // -----------------------------------------------------------------------

  describe("addIncidentUpdate", () => {
    it("adds an update to an incident", () => {
      const incident = seedIncident();
      const updated = addIncidentUpdate({
        incidentId: incident.id,
        status: "identified",
        message: "Root cause found.",
      });

      expect(updated).not.toBeNull();
      expect(updated?.updates).toHaveLength(2);
      expect(updated?.status).toBe("identified");
    });

    it("sets resolvedAt when status is resolved", () => {
      const incident = seedIncident();
      const updated = addIncidentUpdate({
        incidentId: incident.id,
        status: "resolved",
        message: "All clear.",
      });

      expect(updated?.resolvedAt).toBeTruthy();
    });

    it("does not set resolvedAt for non-resolved status", () => {
      const incident = seedIncident();
      const updated = addIncidentUpdate({
        incidentId: incident.id,
        status: "monitoring",
        message: "Watching closely.",
      });

      expect(updated?.resolvedAt).toBeNull();
    });

    it("returns null for unknown incident", () => {
      expect(
        addIncidentUpdate({ incidentId: "nope", status: "resolved", message: "Done." })
      ).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateIncidentImpact
  // -----------------------------------------------------------------------

  describe("updateIncidentImpact", () => {
    it("updates the impact level", () => {
      const incident = seedIncident({ impact: "minor" });
      const updated = updateIncidentImpact(incident.id, "critical");
      expect(updated?.impact).toBe("critical");
    });

    it("returns null for unknown incident", () => {
      expect(updateIncidentImpact("nope", "major")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Maintenance operations
  // -----------------------------------------------------------------------

  describe("createMaintenance", () => {
    it("creates a maintenance window", () => {
      const m = createMaintenance({
        title: "Planned DB Migration",
        description: "Migrating to new schema.",
        affectedComponents: ["database"],
        scheduledStart: "2026-03-01T02:00:00Z",
        scheduledEnd: "2026-03-01T04:00:00Z",
      });

      expect(m.id).toBeTruthy();
      expect(m.title).toBe("Planned DB Migration");
      expect(m.status).toBe("scheduled");
      expect(m.affectedComponents).toEqual(["database"]);
    });
  });

  describe("getMaintenance", () => {
    it("returns maintenance by ID", () => {
      const m = createMaintenance({
        title: "Test",
        description: "Test",
        affectedComponents: [],
        scheduledStart: "2026-03-01T00:00:00Z",
        scheduledEnd: "2026-03-01T01:00:00Z",
      });
      expect(getMaintenance(m.id)?.id).toBe(m.id);
    });

    it("returns null for unknown ID", () => {
      expect(getMaintenance("nope")).toBeNull();
    });
  });

  describe("listMaintenance", () => {
    it("returns all maintenance windows", () => {
      createMaintenance({
        title: "M1", description: "", affectedComponents: [],
        scheduledStart: "2026-03-01T00:00:00Z", scheduledEnd: "2026-03-01T01:00:00Z",
      });
      createMaintenance({
        title: "M2", description: "", affectedComponents: [],
        scheduledStart: "2026-03-02T00:00:00Z", scheduledEnd: "2026-03-02T01:00:00Z",
      });
      expect(listMaintenance()).toHaveLength(2);
    });

    it("filters by status", () => {
      const m = createMaintenance({
        title: "M1", description: "", affectedComponents: [],
        scheduledStart: "2026-03-01T00:00:00Z", scheduledEnd: "2026-03-01T01:00:00Z",
      });
      createMaintenance({
        title: "M2", description: "", affectedComponents: [],
        scheduledStart: "2026-03-02T00:00:00Z", scheduledEnd: "2026-03-02T01:00:00Z",
      });
      updateMaintenanceStatus(m.id, "completed");

      expect(listMaintenance({ status: "completed" })).toHaveLength(1);
      expect(listMaintenance({ status: "scheduled" })).toHaveLength(1);
    });

    it("respects limit", () => {
      for (let i = 0; i < 5; i++) {
        createMaintenance({
          title: `M${i}`, description: "", affectedComponents: [],
          scheduledStart: "2026-03-01T00:00:00Z", scheduledEnd: "2026-03-01T01:00:00Z",
        });
      }
      expect(listMaintenance({ limit: 2 })).toHaveLength(2);
    });
  });

  describe("getUpcomingMaintenance", () => {
    it("returns future scheduled maintenance", () => {
      createMaintenance({
        title: "Future",
        description: "",
        affectedComponents: [],
        scheduledStart: "2099-01-01T00:00:00Z",
        scheduledEnd: "2099-01-01T02:00:00Z",
      });
      createMaintenance({
        title: "Past",
        description: "",
        affectedComponents: [],
        scheduledStart: "2020-01-01T00:00:00Z",
        scheduledEnd: "2020-01-01T02:00:00Z",
      });

      const upcoming = getUpcomingMaintenance();
      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].title).toBe("Future");
    });
  });

  describe("getActiveMaintenance", () => {
    it("returns in-progress maintenance", () => {
      const m = createMaintenance({
        title: "Active",
        description: "",
        affectedComponents: [],
        scheduledStart: "2026-01-01T00:00:00Z",
        scheduledEnd: "2026-12-01T00:00:00Z",
      });
      updateMaintenanceStatus(m.id, "in_progress");

      const active = getActiveMaintenance();
      expect(active).toHaveLength(1);
      expect(active[0].title).toBe("Active");
    });
  });

  describe("updateMaintenanceStatus", () => {
    it("updates status", () => {
      const m = createMaintenance({
        title: "Test", description: "", affectedComponents: [],
        scheduledStart: "2026-03-01T00:00:00Z", scheduledEnd: "2026-03-01T01:00:00Z",
      });
      const updated = updateMaintenanceStatus(m.id, "in_progress");
      expect(updated?.status).toBe("in_progress");
    });

    it("returns null for unknown ID", () => {
      expect(updateMaintenanceStatus("nope", "completed")).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getIncidentStats
  // -----------------------------------------------------------------------

  describe("getIncidentStats", () => {
    it("returns zeroed stats when empty", () => {
      const stats = getIncidentStats();
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.resolved).toBe(0);
      expect(stats.last30Days).toBe(0);
    });

    it("counts incidents correctly", () => {
      seedIncident();
      const resolved = seedIncident();
      addIncidentUpdate({ incidentId: resolved.id, status: "resolved", message: "Fixed." });

      const stats = getIncidentStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.resolved).toBe(1);
      expect(stats.last30Days).toBe(2);
    });
  });
});
