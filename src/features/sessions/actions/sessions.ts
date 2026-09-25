"use server";

import { psychologistApi, type CompleteSessionDto, type CreateSessionDto, type UpdateSessionDto } from "@/lib/api/psychologist";

export async function getSessionsServer(filters?: Parameters<typeof psychologistApi.listSessions>[0]) {
  return psychologistApi.listSessions(filters);
}

export async function createSession(dto: CreateSessionDto) {
  return psychologistApi.createSession(dto);
}

export async function updateSession(sessionId: string, dto: UpdateSessionDto) {
  return psychologistApi.updateSession(sessionId, dto);
}

export async function completeSession(sessionId: string, dto: CompleteSessionDto) {
  return psychologistApi.completeSession(sessionId, dto);
}
