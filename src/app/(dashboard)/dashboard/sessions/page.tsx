import { psychologistApi } from "@/lib/api/psychologist";
import { SessionsManager } from "@/features/sessions/components/SessionsManager";

export default async function SessionsPage() {
  const [sessions, patients] = await Promise.all([
    psychologistApi.listSessions({ page: 1, limit: 100 }),
    psychologistApi.listPatients({ page: 1, limit: 100, sortBy: "nickname", sortOrder: "asc" }),
  ]);
  return <SessionsManager initialSessions={sessions.data} patients={patients.data} />;
}
