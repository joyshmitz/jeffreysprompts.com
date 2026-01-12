/**
 * Status Service
 *
 * Combines health checks with incident data to provide system status.
 */

import { runReadyChecks, runStatusChecks } from "@/lib/health/checks";
import { getActiveIncidents, getUpcomingMaintenance, getActiveMaintenance } from "./incident-store";
import type {
  ComponentStatus,
  ComponentStatusLevel,
  SystemStatusLevel,
  StatusSummary,
} from "./types";

/** Component configuration */
const COMPONENTS = [
  { name: "web", displayName: "Web Application" },
  { name: "api", displayName: "API" },
  { name: "registry", displayName: "Prompt Registry" },
] as const;

/** Map health check results to component status level */
function mapHealthToStatus(
  healthy: boolean,
  inMaintenance: boolean
): ComponentStatusLevel {
  if (inMaintenance) return "maintenance";
  return healthy ? "operational" : "degraded";
}

/** Derive overall system status from components and incidents */
function deriveSystemStatus(
  components: ComponentStatus[],
  activeIncidentCount: number
): SystemStatusLevel {
  // Check for maintenance
  if (components.some((c) => c.status === "maintenance")) {
    return "maintenance";
  }

  // Check for major outage
  if (components.some((c) => c.status === "major_outage")) {
    return "major_outage";
  }

  // Check for partial outage
  if (components.some((c) => c.status === "partial_outage")) {
    return "partial_outage";
  }

  // Check for degraded
  if (components.some((c) => c.status === "degraded") || activeIncidentCount > 0) {
    return "degraded";
  }

  return "operational";
}

/** Get status message for system status level */
function getStatusMessage(status: SystemStatusLevel): string {
  switch (status) {
    case "operational":
      return "All systems operational";
    case "degraded":
      return "Some systems are experiencing issues";
    case "partial_outage":
      return "Partial system outage";
    case "major_outage":
      return "Major system outage";
    case "maintenance":
      return "Scheduled maintenance in progress";
    default:
      return "System status unknown";
  }
}

/** Get component status from health checks */
async function getComponentStatuses(): Promise<ComponentStatus[]> {
  const { checks } = await runStatusChecks();
  const now = new Date().toISOString();
  const activeMaintenance = getActiveMaintenance();
  const maintenanceComponents = new Set(
    activeMaintenance.flatMap((m) => m.affectedComponents)
  );

  const componentStatuses: ComponentStatus[] = [];

  for (const component of COMPONENTS) {
    const healthCheck = checks[component.name];
    const inMaintenance = maintenanceComponents.has(component.name);

    let status: ComponentStatusLevel;
    let latencyMs: number | undefined;

    if (healthCheck) {
      status = mapHealthToStatus(healthCheck.ok, inMaintenance);
      latencyMs = healthCheck.durationMs;
    } else {
      // Component not monitored by health checks - assume operational
      status = inMaintenance ? "maintenance" : "operational";
    }

    componentStatuses.push({
      name: component.name,
      displayName: component.displayName,
      status,
      latencyMs,
      lastChecked: now,
    });
  }

  return componentStatuses;
}

/** Get full status summary */
export async function getStatusSummary(): Promise<StatusSummary> {
  const [components, activeIncidents, upcomingMaintenance] = await Promise.all([
    getComponentStatuses(),
    Promise.resolve(getActiveIncidents()),
    Promise.resolve(getUpcomingMaintenance()),
  ]);

  const status = deriveSystemStatus(components, activeIncidents.length);
  const message = getStatusMessage(status);

  return {
    status,
    message,
    components,
    activeIncidents,
    upcomingMaintenance,
    updatedAt: new Date().toISOString(),
  };
}

/** Quick status check (for badges, headers, etc.) */
export async function getQuickStatus(): Promise<{
  status: SystemStatusLevel;
  message: string;
}> {
  const { status: healthStatus } = await runReadyChecks();
  const activeIncidents = getActiveIncidents();
  const activeMaintenance = getActiveMaintenance();

  let status: SystemStatusLevel;
  if (activeMaintenance.length > 0) {
    status = "maintenance";
  } else if (activeIncidents.some((i) => i.impact === "critical")) {
    status = "major_outage";
  } else if (activeIncidents.some((i) => i.impact === "major")) {
    status = "partial_outage";
  } else if (healthStatus === "degraded" || activeIncidents.length > 0) {
    status = "degraded";
  } else {
    status = "operational";
  }

  return {
    status,
    message: getStatusMessage(status),
  };
}

/** Get status for a specific component */
export async function getComponentStatus(
  componentName: string
): Promise<ComponentStatus | null> {
  const statuses = await getComponentStatuses();
  return statuses.find((c) => c.name === componentName) ?? null;
}
