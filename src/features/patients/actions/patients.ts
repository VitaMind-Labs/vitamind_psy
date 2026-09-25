"use server";

import { psychologistApi, type PatientListQueryDto } from "@/lib/api/psychologist";

export async function getPatientsServer(filters?: PatientListQueryDto) {
  return psychologistApi.listPatients(filters);
}

export async function searchPatientsServer(search: string) {
  return psychologistApi.listPatients({ search, limit: 10, page: 1 });
}
