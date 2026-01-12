/**
 * Incident Store
 *
 * In-memory store for incidents and scheduled maintenance.
 */

import type {
  Incident,
  IncidentStatus,
  IncidentImpact,
  IncidentUpdate,
  ScheduledMaintenance,
} from "./types";

interface IncidentStore {
  incidents: Map<string, Incident>;
  maintenance: Map<string, ScheduledMaintenance>;
  incidentOrder: string[];
  maintenanceOrder: string[];
}

const STORE_KEY = "__jfp_incident_store__";

function getStore(): IncidentStore {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: IncidentStore;
  };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = {
      incidents: new Map(),
      maintenance: new Map(),
      incidentOrder: [],
      maintenanceOrder: [],
    };
  }

  return globalStore[STORE_KEY];
}

function touchIncident(store: IncidentStore, id: string) {
  store.incidentOrder = [id, ...store.incidentOrder.filter((i) => i !== id)];
}

function touchMaintenance(store: IncidentStore, id: string) {
  store.maintenanceOrder = [id, ...store.maintenanceOrder.filter((i) => i !== id)];
}

// Incident Operations

export function createIncident(input: {
  title: string;
  impact: IncidentImpact;
  affectedComponents: string[];
  message: string;
}): Incident {
  const store = getStore();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const incident: Incident = {
    id,
    title: input.title,
    status: "investigating",
    impact: input.impact,
    affectedComponents: input.affectedComponents,
    updates: [
      {
        id: crypto.randomUUID(),
        status: "investigating",
        message: input.message,
        createdAt: now,
      },
    ],
    createdAt: now,
    resolvedAt: null,
  };

  store.incidents.set(id, incident);
  touchIncident(store, id);
  return incident;
}

export function getIncident(id: string): Incident | null {
  const store = getStore();
  return store.incidents.get(id) ?? null;
}

export function listIncidents(options?: {
  status?: IncidentStatus | "all";
  limit?: number;
}): Incident[] {
  const store = getStore();
  const limit = options?.limit ?? 50;
  const statusFilter = options?.status;

  return store.incidentOrder
    .map((id) => store.incidents.get(id))
    .filter((incident): incident is Incident => Boolean(incident))
    .filter((incident) => {
      if (statusFilter && statusFilter !== "all" && incident.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export function getActiveIncidents(): Incident[] {
  return listIncidents().filter((incident) => incident.status !== "resolved");
}

export function getResolvedIncidents(limit = 20): Incident[] {
  return listIncidents({ status: "resolved", limit });
}

export function addIncidentUpdate(input: {
  incidentId: string;
  status: IncidentStatus;
  message: string;
}): Incident | null {
  const store = getStore();
  const incident = store.incidents.get(input.incidentId);
  if (!incident) return null;

  const now = new Date().toISOString();
  const update: IncidentUpdate = {
    id: crypto.randomUUID(),
    status: input.status,
    message: input.message,
    createdAt: now,
  };

  incident.updates.push(update);
  incident.status = input.status;

  if (input.status === "resolved") {
    incident.resolvedAt = now;
  }

  store.incidents.set(input.incidentId, incident);
  touchIncident(store, input.incidentId);
  return incident;
}

export function updateIncidentImpact(
  incidentId: string,
  impact: IncidentImpact
): Incident | null {
  const store = getStore();
  const incident = store.incidents.get(incidentId);
  if (!incident) return null;

  incident.impact = impact;
  store.incidents.set(incidentId, incident);
  return incident;
}

// Maintenance Operations

export function createMaintenance(input: {
  title: string;
  description: string;
  affectedComponents: string[];
  scheduledStart: string;
  scheduledEnd: string;
}): ScheduledMaintenance {
  const store = getStore();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const maintenance: ScheduledMaintenance = {
    id,
    title: input.title,
    description: input.description,
    affectedComponents: input.affectedComponents,
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
    status: "scheduled",
    createdAt: now,
  };

  store.maintenance.set(id, maintenance);
  touchMaintenance(store, id);
  return maintenance;
}

export function getMaintenance(id: string): ScheduledMaintenance | null {
  const store = getStore();
  return store.maintenance.get(id) ?? null;
}

export function listMaintenance(options?: {
  status?: "scheduled" | "in_progress" | "completed" | "all";
  limit?: number;
}): ScheduledMaintenance[] {
  const store = getStore();
  const limit = options?.limit ?? 20;
  const statusFilter = options?.status;

  return store.maintenanceOrder
    .map((id) => store.maintenance.get(id))
    .filter((m): m is ScheduledMaintenance => Boolean(m))
    .filter((m) => {
      if (statusFilter && statusFilter !== "all" && m.status !== statusFilter) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export function getUpcomingMaintenance(): ScheduledMaintenance[] {
  const now = new Date().toISOString();
  return listMaintenance({ status: "scheduled" })
    .filter((m) => m.scheduledStart > now)
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
}

export function getActiveMaintenance(): ScheduledMaintenance[] {
  return listMaintenance({ status: "in_progress" });
}

export function updateMaintenanceStatus(
  id: string,
  status: "scheduled" | "in_progress" | "completed"
): ScheduledMaintenance | null {
  const store = getStore();
  const maintenance = store.maintenance.get(id);
  if (!maintenance) return null;

  maintenance.status = status;
  store.maintenance.set(id, maintenance);
  return maintenance;
}

// Statistics

export function getIncidentStats(): {
  total: number;
  active: number;
  resolved: number;
  last30Days: number;
} {
  const store = getStore();
  const incidents = Array.from(store.incidents.values());
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    total: incidents.length,
    active: incidents.filter((i) => i.status !== "resolved").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    last30Days: incidents.filter((i) => i.createdAt >= thirtyDaysAgo).length,
  };
}
