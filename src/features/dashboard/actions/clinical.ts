"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function acknowledgeAlertAction(alertId: string) {
  return psychologistApi.acknowledgeAlert(alertId);
}

export async function resolveAlertAction(alertId: string, resolution: "GROUNDING_COMPLETED" | "CONTACT_MADE" | "UNRESOLVED" | "FALSE_ALERT", resolutionNote?: string) {
  return psychologistApi.resolveAlert(alertId, resolution, resolutionNote);
}

export async function proposeSessionAction(alertId: string) {
  return psychologistApi.proposeSession(alertId);
}
