import { psychologistApi, type CaseloadQuery, type PatientListQueryDto, type PatientStatus, type TrafficLight } from "@/lib/api/psychologist";
import { PatientsWorkspace, type PatientsView } from "@/features/patients/components/PatientsWorkspace";

type Params = Record<string, string | string[] | undefined>;

const STATUSES: PatientStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"];
const LIGHTS: TrafficLight[] = ["RED", "AMBER", "GREEN"];
const SORTS: NonNullable<PatientListQueryDto["sortBy"]>[] = ["lastActivityAt", "lastAssessmentAt", "nickname", "createdAt"];

const pick = <T extends string>(value: unknown, allowed: readonly T[]) => (allowed.includes(value as T) ? (value as T) : undefined);
const str = (params: Params, key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

export default async function PatientsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const view: PatientsView = str(params, "view") === "triage" ? "triage" : "directory";
  const page = Math.max(Number(str(params, "page")) || 1, 1);
  const search = str(params, "search")?.trim() || undefined;

  const directoryQuery: PatientListQueryDto = {
    page,
    limit: 15,
    search,
    status: pick(str(params, "status"), STATUSES),
    sortBy: pick(str(params, "sortBy"), SORTS) ?? "lastActivityAt",
    sortOrder: str(params, "sortOrder") === "asc" ? "asc" : "desc",
  };

  const triageQuery: CaseloadQuery = {
    page,
    limit: 25,
    search,
    sort: str(params, "sort") === "drift" ? "drift" : "risk",
    trafficLight: pick(str(params, "trafficLight"), LIGHTS),
    role: str(params, "role") as CaseloadQuery["role"],
  };

  // The unfiltered caseload powers the KPI strip on both views.
  const [summary, directory, triage] = await Promise.all([
    psychologistApi.getCaseload({ page: 1, limit: 100, sort: "risk" }),
    view === "directory" ? psychologistApi.listPatients(directoryQuery) : Promise.resolve(null),
    view === "triage" ? psychologistApi.getCaseload(triageQuery) : Promise.resolve(null),
  ]);

  return (
    <PatientsWorkspace
      view={view}
      summary={summary}
      directory={directory}
      triage={triage}
      directoryQuery={directoryQuery}
      triageQuery={triageQuery}
    />
  );
}
