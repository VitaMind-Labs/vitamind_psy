"use client";

import { useCallback, useState } from "react";
import { createPatientNote, deletePatientNote, getNotesServer, updatePatientNote } from "@/features/notes/actions";
import type { CreateNoteDto, PsychologistNote, UpdateNoteDto } from "@/lib/api/psychologist";

export function useNotes(patientId: string, initialNotes: PsychologistNote[]) {
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { setLoading(true); setError(null); try { const response = await getNotesServer(patientId); setNotes(response.data); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Chargement impossible."); } finally { setLoading(false); } }, [patientId]);
  const create = async (dto: CreateNoteDto) => { const note = await createPatientNote(patientId, dto); setNotes((current) => [note, ...current]); return note; };
  const update = async (noteId: string, dto: UpdateNoteDto) => { const note = await updatePatientNote(patientId, noteId, dto); setNotes((current) => current.map((item) => item.id === note.id ? note : item)); return note; };
  const remove = async (noteId: string) => { await deletePatientNote(patientId, noteId); setNotes((current) => current.filter((item) => item.id !== noteId)); };
  return { notes, loading, error, refetch, create, update, remove };
}
