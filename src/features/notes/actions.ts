"use server";

import { psychologistApi, type CreateNoteDto, type UpdateNoteDto } from "@/lib/api/psychologist";

export async function getNotesServer(patientId: string) {
  return psychologistApi.listNotes(patientId);
}

export async function createPatientNote(patientId: string, dto: CreateNoteDto) {
  return psychologistApi.createNote(patientId, dto);
}

export async function updatePatientNote(patientId: string, noteId: string, dto: UpdateNoteDto) {
  return psychologistApi.updateNote(patientId, noteId, dto);
}

export async function deletePatientNote(patientId: string, noteId: string) {
  return psychologistApi.deleteNote(patientId, noteId);
}
