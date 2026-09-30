"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Bell, Building2, Check, Circle, Globe, KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updatePsychologistProfile } from "@/features/settings/actions/settings";
import { logoutPsychologist } from "@/features/auth/actions/auth";
import { PsyTwoFactorSetup } from "@/features/auth/components/PsyTwoFactorSetup";
import type { PsychologistProfile } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, underlineTabsList, underlineTabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { Panel } from "@/components/layout/Kpi";
import { ROLE_LABELS } from "@/components/layout/Sidebar";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\+?[\d\s()-]{7,20}$/.test(value), "Enter a valid phone number."),
  specialties: z.string().trim(),
  avatarUrl: z.string().trim().url("Use a complete image URL.").or(z.literal("")),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const profileDefaults = (profile: PsychologistProfile): ProfileFormValues => ({
  firstName: profile.firstName ?? "",
  lastName: profile.lastName ?? "",
  phone: profile.phone ?? "",
  specialties: profile.specialties.join(", "),
  avatarUrl: profile.avatarUrl ?? "",
});

const splitSpecialties = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const formatDate = (value: string | null | undefined) => (value ? format(new Date(value), "MMM d, yyyy") : null);

export function SettingsView({ profile }: { profile: PsychologistProfile }) {
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Account" title="Settings" description="Your professional profile, preferences and account security." />
      <Tabs defaultValue="profile">
        <TabsList aria-label="Settings sections" className={underlineTabsList}>
          <TabsTrigger value="profile" className={underlineTabsTrigger}><UserRound size={14} aria-hidden /> Profile</TabsTrigger>
          <TabsTrigger value="preferences" className={underlineTabsTrigger}><Bell size={14} aria-hidden /> Preferences</TabsTrigger>
          <TabsTrigger value="security" className={underlineTabsTrigger}><ShieldCheck size={14} aria-hidden /> Security & compliance</TabsTrigger>
          <TabsTrigger value="clinic" className={underlineTabsTrigger}><Building2 size={14} aria-hidden /> Clinic</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6"><ProfileTab profile={profile} /></TabsContent>
        <TabsContent value="preferences" className="mt-6"><PreferencesTab profile={profile} /></TabsContent>
        <TabsContent value="security" className="mt-6"><SecurityTab profile={profile} /></TabsContent>
        <TabsContent value="clinic" className="mt-6"><ClinicTab profile={profile} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab({ profile }: { profile: PsychologistProfile }) {
  const router = useRouter();
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: profileDefaults(profile) });
  const values = useWatch({ control: form.control });
  const { isDirty, isSubmitting } = form.formState;

  const checks = useMemo(
    () => [
      { label: "Full name", done: Boolean(values.firstName && values.lastName) },
      { label: "Phone number", done: Boolean(values.phone) },
      { label: "At least one specialty", done: splitSpecialties(values.specialties ?? "").length > 0 },
      { label: "License on file", done: Boolean(profile.license?.status) },
      { label: "Clinical terms accepted", done: Boolean(profile.termsAcceptedAt) },
    ],
    [values.firstName, values.lastName, values.phone, values.specialties, profile.license?.status, profile.termsAcceptedAt],
  );
  const completed = checks.filter((item) => item.done).length;

  const save = form.handleSubmit(async (data) => {
    try {
      const result = await updatePsychologistProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        specialties: splitSpecialties(data.specialties),
        avatarUrl: data.avatarUrl || undefined,
      });
      form.reset(profileDefaults(result.psychologist));
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    }
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel title="Professional profile" description="Shown to your care team and on patient-facing reports.">
        <Form {...form}>
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} autoComplete="given-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} autoComplete="family-name" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="settings-email" className="text-sm font-medium text-slate-900">Work email</label>
                <Input id="settings-email" value={profile.email} disabled readOnly aria-describedby="settings-email-hint" />
                <p id="settings-email-hint" className="text-xs text-slate-500">Managed by your clinic administrator.</p>
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} type="tel" autoComplete="tel" placeholder="+971 50 000 0000" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="specialties" render={({ field }) => (
              <FormItem>
                <FormLabel>Specialties</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. CBT, trauma, adolescent care" /></FormControl>
                <FormDescription>Separate with commas.</FormDescription>
                {splitSpecialties(field.value).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {splitSpecialties(field.value).map((item) => <Badge key={item} variant="brand">{item}</Badge>)}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="avatarUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar URL <span className="font-normal text-slate-500">(optional)</span></FormLabel>
                <FormControl><Input {...field} type="url" placeholder="https://…" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="ghost" disabled={!isDirty || isSubmitting} onClick={() => form.reset(profileDefaults(profile))}>
                Discard
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </Panel>

      <Panel title="Profile completeness" description={`${completed} of ${checks.length} complete`}>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={checks.length} aria-label="Profile completeness">
          <div className="h-full rounded-full bg-teal-600 transition-[width] duration-300" style={{ width: `${(completed / checks.length) * 100}%` }} />
        </div>
        <ul className="mt-4 space-y-2.5">
          {checks.map((item) => (
            <li key={item.label} className={cn("flex items-center gap-2.5 text-sm", item.done ? "text-slate-700" : "text-slate-500")}>
              {item.done ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><Check size={12} aria-hidden /></span>
              ) : (
                <Circle size={20} aria-hidden className="text-slate-300" />
              )}
              {item.label}
              <span className="sr-only">{item.done ? "(complete)" : "(incomplete)"}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function PreferencesTab({ profile }: { profile: PsychologistProfile }) {
  return (
    <div className="grid max-w-3xl gap-4">
      <Panel title="Clinical notifications" description="Delivery rules agreed during onboarding.">
        <ul className="divide-y divide-slate-100">
          <SettingRow
            title="Critical safety alerts"
            description="High and critical alerts are delivered in-app in real time and cannot be muted."
            value={<Badge variant={profile.termsAcceptedAt ? "success" : "warning"} dot>{profile.termsAcceptedAt ? "Always on" : "Pending terms"}</Badge>}
          />
          <SettingRow
            title="Weekly report reminders"
            description="A reminder is sent when a report stays unacknowledged for 72 hours."
            value={<Badge variant="success" dot>On</Badge>}
          />
          <SettingRow title="Email delivery" description="No clinical data is ever sent by email." value={<Badge>Disabled by policy</Badge>} />
        </ul>
      </Panel>
    </div>
  );
}

function SecurityTab({ profile }: { profile: PsychologistProfile }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const now = useNow();
  const license = profile.license;
  const expires = license?.expiresAt ? new Date(license.expiresAt) : null;
  const expiringSoon = expires ? expires.getTime() - now < 60 * 24 * 3600 * 1000 : false;

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logoutPsychologist();
    } finally {
      router.replace("/signin");
      router.refresh();
    }
  };

  return (
    <div className="grid max-w-3xl gap-4">
      <Panel
        title="Professional license"
        action={<Badge variant={profile.status === "ACTIVE" ? "success" : "warning"} dot>{profile.status === "ACTIVE" ? "Verified access" : profile.status.toLowerCase()}</Badge>}
      >
        <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 sm:grid-cols-3">
          <Fact label="Authority" value={license?.authorityName || license?.authority?.replaceAll("_", " ") || "Not provided"} />
          <Fact label="Status" value={license?.status ?? "Pending"} />
          <Fact label="Expires" value={formatDate(license?.expiresAt) ?? "—"} tone={expiringSoon ? "warning" : undefined} />
        </dl>
        {expiringSoon && <p className="mt-3 text-xs font-medium text-amber-800">Your license expires within 60 days. Contact your clinic to renew it.</p>}
      </Panel>

      <Panel title="Compliance">
        <ul className="divide-y divide-slate-100">
          <SettingRow title="Clinical terms" description={profile.termsVersion ? `Version ${profile.termsVersion}` : "Current version"} value={<span className="text-sm text-slate-700">{formatDate(profile.termsAcceptedAt) ?? "Not accepted"}</span>} />
          <SettingRow title="Account created" description="All clinical access is audited." value={<span className="text-sm text-slate-700">{formatDate(profile.createdAt)}</span>} />
        </ul>
      </Panel>

      <Panel title="Session">
        <ul className="divide-y divide-slate-100">
          <SettingRow title="Password" description="Password changes are handled by your clinic administrator." value={<KeyRound size={16} aria-hidden className="text-slate-400" />} />
          <SettingRow
            title="Two-factor authentication"
            description={profile.is2FAEnabled ? "An authenticator code is required at every sign-in." : "Add an authenticator code to every sign-in."}
            value={
              profile.is2FAEnabled ? (
                <Badge variant="success" dot>Enabled</Badge>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEnrolling(true)}>
                  <ShieldCheck size={14} aria-hidden /> Enable 2FA
                </Button>
              )
            }
          />
          <SettingRow
            title="Sign out of this device"
            description="Ends your session and clears secure cookies."
            value={<Button size="sm" variant="secondary" loading={signingOut} onClick={() => void signOut()}>{!signingOut && <LogOut size={14} aria-hidden />} Sign out</Button>}
          />
        </ul>
      </Panel>

      <Dialog open={enrolling} onOpenChange={setEnrolling}>
        <DialogContent className="max-w-md gap-4 overflow-x-hidden p-5 sm:p-6">
          <DialogTitle className="sr-only">Enable two-factor authentication</DialogTitle>
          <DialogDescription className="sr-only">
            Enrol an authenticator app and save your recovery codes.
          </DialogDescription>
          {enrolling && (
            <PsyTwoFactorSetup
              onCancel={() => setEnrolling(false)}
              onComplete={() => {
                setEnrolling(false);
                toast.success("Two-factor authentication enabled");
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClinicTab({ profile }: { profile: PsychologistProfile }) {
  const clinic = profile.clinic;
  return (
    <div className="grid max-w-3xl gap-4">
      <Panel title={clinic?.name ?? "Independent practice"} description={clinic ? `Country: ${clinic.country}` : "You are not attached to a clinic."}>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 sm:grid-cols-3">
          <Fact label="Your role" value={ROLE_LABELS[profile.clinicalRole]} />
          <Fact label="Clinic admin" value={profile.isClinicAdmin ? "Yes" : "No"} />
          <Fact label="Emergency line" value={clinic?.emergencyNumber ?? "Not configured"} tone={clinic?.emergencyNumber ? undefined : "warning"} />
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Alert thresholds and relapse signatures are configured per patient from the patient record.
        </p>
      </Panel>
    </div>
  );
}

function SettingRow({ title, description, value }: { title: string; description: string; value: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <div className="shrink-0">{value}</div>
    </li>
  );
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className={cn("bg-white p-3.5", tone === "warning" && "bg-amber-50/60")}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-semibold capitalize", tone === "warning" ? "text-amber-800" : "text-slate-900")}>{value}</dd>
    </div>
  );
}
