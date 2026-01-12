/**
 * Status Page Types
 *
 * Types for the public status page and incident management.
 */

/** Status levels for components */
export type ComponentStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

/** Component health status */
export interface ComponentStatus {
  name: string;
  displayName: string;
  status: ComponentStatusLevel;
  latencyMs?: number;
  lastChecked: string;
}

/** Overall system status derived from components */
export type SystemStatusLevel =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

/** Status of an incident */
export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

/** Impact level of an incident */
export type IncidentImpact = "none" | "minor" | "major" | "critical";

/** An incident update */
export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

/** An incident record */
export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  affectedComponents: string[];
  updates: IncidentUpdate[];
  createdAt: string;
  resolvedAt: string | null;
}

/** A scheduled maintenance window */
export interface ScheduledMaintenance {
  id: string;
  title: string;
  description: string;
  affectedComponents: string[];
  scheduledStart: string;
  scheduledEnd: string;
  status: "scheduled" | "in_progress" | "completed";
  createdAt: string;
}

/** Status subscriber */
export interface StatusSubscriber {
  id: string;
  email: string;
  confirmedAt: string | null;
  createdAt: string;
}

/** Status page summary */
export interface StatusSummary {
  status: SystemStatusLevel;
  message: string;
  components: ComponentStatus[];
  activeIncidents: Incident[];
  upcomingMaintenance: ScheduledMaintenance[];
  updatedAt: string;
}

/** Historical uptime data point */
export interface UptimeDataPoint {
  date: string;
  status: ComponentStatusLevel;
}

/** Component uptime summary */
export interface ComponentUptime {
  component: string;
  displayName: string;
  uptimePercent: number;
  history: UptimeDataPoint[];
}
