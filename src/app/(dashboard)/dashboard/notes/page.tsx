import { psychologistApi } from "@/lib/api/psychologist";
import { NotesWorkspace } from "@/features/notes/components/NotesWorkspace";

export default async function NotesPage() {
  // One request: the latest notes plus per-patient documentation coverage.
  const overview = await psychologistApi.getNotesOverview(100);
  return <NotesWorkspace overview={overview} />;
}
