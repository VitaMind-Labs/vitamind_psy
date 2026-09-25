"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function getPatientProgressServer(patientId: string, from?: string, to?: string) {
  return psychologistApi.getPatientProgress(patientId, { from, to });
}
