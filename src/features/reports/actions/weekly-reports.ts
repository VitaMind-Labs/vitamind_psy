"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function acknowledgeWeeklyReportAction(reportId: string) {
  return psychologistApi.acknowledgeWeeklyReport(reportId);
}

export async function annotateWeeklyReportAction(reportId: string, note: string) {
  return psychologistApi.annotateWeeklyReport(reportId, note);
}

export async function addReportPrivateNoteAction(patientId: string, reportId: string, content: string) {
  return psychologistApi.createNote(patientId, { content, weeklyReportId: reportId });
}
