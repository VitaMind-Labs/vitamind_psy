import { psychologistApi, type AssignmentRequestView } from "@/lib/api/psychologist";
import { RequestsInbox } from "@/features/requests/components/RequestsInbox";

const VIEWS: AssignmentRequestView[] = ["AWAITING_ME", "AWAITING_PATIENT", "DECLINED"];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const view = VIEWS.find((v) => v === params.view) ?? "AWAITING_ME";
  const list = await psychologistApi.listAssignmentRequests({ view, limit: 50 });
  return <RequestsInbox list={list} view={view} />;
}
