import { psychologistApi } from "@/lib/api/psychologist";
import { CoverageView } from "@/features/clinical/components/CoverageView";

export default async function CoveragePage() {
  const [profile, coverage, colleagues] = await Promise.all([
    psychologistApi.getMe(),
    psychologistApi.getCoverage(),
    psychologistApi.getColleagues().catch(() => ({ data: [] })),
  ]);
  return (
    <CoverageView
      initialCoverage={coverage.data}
      colleagues={colleagues.data}
      // Anyone can declare their own absence; booking cover for others is the clinic lead's.
      canEdit={(profile.role === "PSYCHIATRIST" || profile.isClinicAdmin) && !!profile.clinic}
      currentUser={{ id: profile.id, name: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email }}
    />
  );
}
