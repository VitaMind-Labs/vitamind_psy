"use server";

import { psychologistApi } from "@/lib/api/psychologist";
import type { Medication, RelapseSignature, ThresholdItem } from "@/lib/api/psychologist";

export async function updateThresholdsAction(patientId: string, thresholds: ThresholdItem[]) { return psychologistApi.updateThresholds(patientId, thresholds); }
export async function createRelapseSignatureAction(patientId: string, dto: Partial<RelapseSignature>) { return psychologistApi.createRelapseSignature(patientId, dto); }
export async function updateRelapseSignatureAction(patientId: string, signatureId: string, dto: Partial<RelapseSignature>) { return psychologistApi.updateRelapseSignature(patientId, signatureId, dto); }
export async function createMedicationAction(patientId: string, dto: Pick<Medication, "name" | "dosage" | "frequency" | "instructions" | "startDate" | "endDate">) { return psychologistApi.createMedication(patientId, dto); }
export async function updateMedicationAction(patientId: string, medicationId: string, dto: Partial<Medication>) { return psychologistApi.updateMedication(patientId, medicationId, dto); }
export async function createTimelineEventAction(patientId: string, dto: { title: string; details?: string; occurredAt: string; medicationId?: string }) { return psychologistApi.createTimelineEvent(patientId, dto); }
export async function reviseDiagnosisAction(patientId: string, dto: { diagnosis?: string; diagnosisLabel?: string; status?: string; notes?: string }) { return psychologistApi.reviseDiagnosis(patientId, dto); }
export async function assignExerciseAction(patientId: string, dto: { exerciseId: string; frequency?: string; note?: string; startsAt?: string; endsAt?: string }) { return psychologistApi.assignExercise(patientId, dto); }
export async function createGoalAction(patientId: string, dto: { title: string; description?: string; weekStart?: string }) { return psychologistApi.createGoal(patientId, dto); }
export async function sendMessageAction(patientId: string, content: string, isUrgent = false) { return psychologistApi.sendMessage(patientId, content, isUrgent); }
export async function createCoverageAction(dto: { coveringId: string; absentId?: string; type?: "ON_CALL" | "LEAVE_COVER"; startsAt: string; endsAt: string }) { return psychologistApi.createCoverage(dto); }
export async function exportWeeklyReportAction(reportId: string) { return psychologistApi.exportWeeklyReport(reportId); }

export async function removeCoverageAction(shiftId: string) { return psychologistApi.removeCoverage(shiftId); }
