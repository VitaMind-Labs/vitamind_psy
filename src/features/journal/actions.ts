"use server";

import { psychologistApi, type JournalListQueryDto } from "@/lib/api/psychologist";

export async function getPatientJournalServer(patientId: string, filters?: JournalListQueryDto) {
  return psychologistApi.getPatientJournal(patientId, filters);
}
