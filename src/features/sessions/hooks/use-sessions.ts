"use client";

import { useCallback, useState } from "react";
import { completeSession, createSession, getSessionsServer, updateSession } from "@/features/sessions/actions/sessions";
import type { CompleteSessionDto, CreateSessionDto, SessionListItem, SessionListQueryDto, UpdateSessionDto } from "@/lib/api/psychologist";

export function useSessions(initialData: SessionListItem[], filters?: SessionListQueryDto) {
  const [sessions, setSessions] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { setLoading(true); setError(null); try { const response = await getSessionsServer(filters); setSessions(response.data); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Chargement impossible."); } finally { setLoading(false); } }, [filters]);
  const create = async (dto: CreateSessionDto) => { const session = await createSession(dto); setSessions((current) => [session, ...current]); return session; };
  const update = async (sessionId: string, dto: UpdateSessionDto) => { const session = await updateSession(sessionId, dto); setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, ...session, patientId: item.patientId, patientName: item.patientName } : item)); return session; };
  const complete = async (sessionId: string, dto: CompleteSessionDto) => { await completeSession(sessionId, dto); setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, status: "COMPLETED" } : item)); };
  return { sessions, loading, error, refetch, create, update, complete };
}
