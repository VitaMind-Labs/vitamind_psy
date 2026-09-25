"use server";

import { psychologistApi, type AssessmentReviewDto } from "@/lib/api/psychologist";

export async function getAssessmentServer(patientId: string, assessmentId: string) {
  return psychologistApi.getAssessment(patientId, assessmentId);
}

export async function reviewAssessment(patientId: string, assessmentId: string, dto: AssessmentReviewDto) {
  return psychologistApi.reviewAssessment(patientId, assessmentId, dto);
}
