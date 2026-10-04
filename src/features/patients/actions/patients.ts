"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function searchPatientsServer(search: string) {
  return psychologistApi.listPatients({ search, limit: 10, page: 1 });
}

export async function getLifeChartServer(patientId: string, from?: string, to?: string) {
  return psychologistApi.getLifeChart(patientId, { from, to });
}
