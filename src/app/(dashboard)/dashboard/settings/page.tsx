import { psychologistApi } from "@/lib/api/psychologist";
import { SettingsView } from "@/features/settings/components/SettingsView";

export default async function SettingsPage() {
  const profile = await psychologistApi.getMe();
  return <SettingsView profile={profile} />;
}
