import { redirect } from "next/navigation";
import { psychologistApi } from "@/lib/api/psychologist";

/**
 * `/dashboard` is the post-login landing route. The former caseload board now lives
 * in Patients → Risk triage; this route only forwards to the right home screen.
 */
export default async function DashboardIndexPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [profile, params] = await Promise.all([psychologistApi.getMe(), searchParams]);
  if (profile.role === "CARE_COORDINATOR") redirect("/dashboard/sessions");

  // Preserve old caseload deep links (e.g. /dashboard?trafficLight=RED).
  const legacy = new URLSearchParams();
  for (const key of ["sort", "trafficLight", "role", "search"]) {
    const value = params[key];
    if (typeof value === "string" && value) legacy.set(key, value);
  }
  if (legacy.size > 0) redirect(`/dashboard/patients?view=triage&${legacy.toString()}`);
  redirect("/dashboard/overview");
}
