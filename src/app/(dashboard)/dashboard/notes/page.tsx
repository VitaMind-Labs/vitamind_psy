import { psychologistApi, type PsychologistNote } from "@/lib/api/psychologist";
import { NotesWorkspace } from "@/features/notes/components/NotesWorkspace";

const PATIENT_LIMIT = 50;

export default async function NotesPage() {
  // No cross-patient notes endpoint exists, so aggregate over the most recently active patients.
  const patients = await psychologistApi.listPatients({ page: 1, limit: PATIENT_LIMIT, sortBy: "lastActivityAt", sortOrder: "desc" });
  const results = await Promise.allSettled(patients.data.map((patient) => psychologistApi.listNotes(patient.id)));
  const records = patients.data.map((patient, index) => {
    const result = results[index];
    return { patient, notes: result.status === "fulfilled" ? result.value.data : ([] as PsychologistNote[]) };
  });
  return (
    <NotesWorkspace
      records={records}
      failedCount={results.filter((result) => result.status === "rejected").length}
      truncated={patients.meta.total > PATIENT_LIMIT}
      totalPatients={patients.meta.total}
    />
  );
}
