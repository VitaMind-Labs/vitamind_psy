import { psychologistApi } from "@/lib/api/psychologist";
import { SessionsManager } from "@/features/sessions/components/SessionsManager";

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ patientId?: string }> }) {
  const { patientId } = await searchParams;
  const [sessions, patients] = await Promise.all([
    // Most recent first: with a cap, it is the oldest sessions that should drop off, never the upcoming ones.
    psychologistApi.listSessions({ order: "desc", page: 1, limit: 100 }),
    psychologistApi.listPatients({ page: 1, limit: 100, sortBy: "nickname", sortOrder: "asc" }),
  ]);
  return <SessionsManager initialSessions={sessions.data} patients={patients.data} initialPatientId={patientId} />;
}
