import { psychologistApi } from "@/lib/api/psychologist";
import { CoverageView } from "@/features/clinical/components/CoverageView";

export default async function CoveragePage() {
  const [profile, coverage] = await Promise.all([psychologistApi.getMe(), psychologistApi.getCoverage()]);
  return (
    <CoverageView
      initialCoverage={coverage.data}
      canEdit={profile.role === "PSYCHIATRIST" || profile.isClinicAdmin}
      currentUser={{ id: profile.id, name: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email }}
    />
  );
}
