"use server";

import { psychologistApi } from "@/lib/api/psychologist";

export async function acceptAssignmentRequest(assignmentId: string) {
  return psychologistApi.acceptAssignmentRequest(assignmentId);
}

export async function declineAssignmentRequest(assignmentId: string, reason: string) {
  return psychologistApi.declineAssignmentRequest(assignmentId, reason);
}
