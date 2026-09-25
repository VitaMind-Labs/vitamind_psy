"use server";

import { psychologistApi, type AssessmentListQueryDto } from "@/lib/api/psychologist";

export async function getPatientAssessmentsServer(patientId: string, filters?: AssessmentListQueryDto) {
  return psychologistApi.listAssessments(patientId, filters);
}
