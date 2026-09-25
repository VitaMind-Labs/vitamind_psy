"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, Check } from "lucide-react";
import { registerPsychologist } from "@/features/auth/actions/auth";
import type { ClinicianRole, PsychologistRegisterDto } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthField, FormAlert } from "@/features/auth/components/AuthField";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<ClinicianRole, string> = {
  PSYCHIATRIST: "Psychiatrist",
  PSYCHOLOGIST: "Psychologist",
  THERAPIST: "Therapist",
  NURSE: "Nurse",
  CARE_COORDINATOR: "Care coordinator",
};

const AUTHORITY_LABELS: Record<PsychologistRegisterDto["authority"], string> = {
  DOH_ABU_DHABI: "DoH Abu Dhabi",
  DHA: "DHA (Dubai)",
  MOHAP: "MOHAP",
  OTHER: "Other authority",
};

const mustAccept = (message: string) => z.boolean().refine((value) => value, { message });

const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter your first name."),
    lastName: z.string().trim().min(1, "Enter your last name."),
    email: z.string().trim().min(1, "Enter your work email.").email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\+?[\d\s()-]{7,20}$/.test(value), "Enter a valid phone number."),
    password: z.string().min(8, "Use at least 8 characters."),
    authority: z.enum(["DOH_ABU_DHABI", "DHA", "MOHAP", "OTHER"]),
    authorityName: z.string().trim().optional(),
    licenseNumber: z.string().trim().min(1, "Enter your license number."),
    clinicalRole: z.enum(["PSYCHIATRIST", "PSYCHOLOGIST", "THERAPIST", "NURSE", "CARE_COORDINATOR"]),
    termsAccepted: mustAccept("Accept the clinical terms to continue."),
    safetyAlertsAccepted: mustAccept("Safety alerts are required for clinical accounts."),
    monitoringNoticeAccepted: mustAccept("Please acknowledge the monitoring notice."),
  })
  .refine((data) => data.authority !== "OTHER" || Boolean(data.authorityName), {
    path: ["authorityName"],
    message: "Name the licensing authority.",
  });

type SignupValues = z.infer<typeof signupSchema>;

const STEPS = [
  { title: "Your details", fields: ["firstName", "lastName", "email", "phone", "password"] },
  { title: "License & consent", fields: ["authority", "authorityName", "licenseNumber", "clinicalRole", "termsAccepted", "safetyAlertsAccepted", "monitoringNoticeAccepted"] },
] as const satisfies ReadonlyArray<{ title: string; fields: ReadonlyArray<keyof SignupValues> }>;

function passwordStrength(value: string) {
  const checks = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  return { score, label: ["Too short", "Weak", "Fair", "Good", "Strong"][score] };
}

export function SignupScreen() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      authority: "DHA",
      authorityName: "",
      licenseNumber: "",
      clinicalRole: "PSYCHOLOGIST",
      termsAccepted: false,
      safetyAlertsAccepted: false,
      monitoringNoticeAccepted: false,
    },
  });

  const [password, authority] = useWatch({ control, name: ["password", "authority"] });
  const strength = useMemo(() => passwordStrength(password ?? ""), [password]);

  const next = async () => {
    if (await trigger([...STEPS[0].fields], { shouldFocus: true })) setStep(1);
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const dto: PsychologistRegisterDto = {
      ...values,
      phone: values.phone || undefined,
      authorityName: values.authority === "OTHER" ? values.authorityName : undefined,
    };
    const result = await registerPsychologist(dto);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSuccess(result.data.message);
  });

  const slide = reduceMotion
    ? {}
    : { initial: { opacity: 0, x: 12 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 }, transition: { duration: 0.2 } };

  if (success) {
    return (
      <motion.div {...(reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } })} className="w-full max-w-[440px] text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <BadgeCheck size={26} aria-hidden />
        </span>
        <h1 className="mt-6 text-[1.75rem] font-semibold tracking-tight text-slate-900">Request received</h1>
        <p className="mt-2 text-sm text-slate-600">{success}</p>
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-left">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <p className="mt-1 text-sm text-slate-600">
            Your clinic verifies your license with the selected authority. You can sign in as soon as your account is approved.
          </p>
        </div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/signin">
            Back to sign in <ArrowRight size={16} aria-hidden />
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-[480px]">
      <header>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-slate-900">Request clinician access</h1>
        <p className="mt-1.5 text-sm text-slate-600">Your account stays pending until your license is verified.</p>
      </header>

      <ol className="mt-6 grid grid-cols-2 gap-2" aria-label="Sign-up progress">
        {STEPS.map((item, index) => (
          <li key={item.title} aria-current={index === step ? "step" : undefined}>
            <span className={cn("block h-1 rounded-full transition-colors", index <= step ? "bg-slate-900" : "bg-slate-200")} />
            <span className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", index <= step ? "text-slate-900" : "text-slate-500")}>
              {index < step && <Check size={12} aria-hidden />}
              {index + 1}. {item.title}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} noValidate className="mt-7">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.fieldset key="details" {...slide} className="space-y-4">
              <legend className="sr-only">Your details</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
                <AuthField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
              </div>
              <AuthField label="Work email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" placeholder="you@clinic.com" error={errors.email?.message} {...register("email")} />
              <AuthField label="Phone" optional type="tel" autoComplete="tel" inputMode="tel" placeholder="+971 50 000 0000" error={errors.phone?.message} {...register("phone")} />
              <AuthField
                label="Password"
                revealable
                autoComplete="new-password"
                error={errors.password?.message}
                hint={
                  <span className="flex items-center gap-2">
                    <span className="flex flex-1 gap-1" aria-hidden>
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            strength.score >= level ? (strength.score <= 1 ? "bg-red-400" : strength.score === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200",
                          )}
                        />
                      ))}
                    </span>
                    <span className="w-16 text-right">{password ? strength.label : "8+ chars"}</span>
                  </span>
                }
                {...register("password")}
              />
              <Button type="button" size="lg" className="mt-2 w-full" onClick={next}>
                Continue <ArrowRight size={16} aria-hidden />
              </Button>
            </motion.fieldset>
          ) : (
            <motion.fieldset key="license" {...slide} className="space-y-4">
              <legend className="sr-only">License and consent</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-900" id="authority-label">Licensing authority</label>
                  <Controller
                    control={control}
                    name="authority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-labelledby="authority-label" className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(AUTHORITY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <AuthField label="License number" autoComplete="off" error={errors.licenseNumber?.message} {...register("licenseNumber")} />
              </div>
              {authority === "OTHER" && (
                <AuthField label="Authority name" error={errors.authorityName?.message} {...register("authorityName")} />
              )}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-900" id="role-label">Clinical role</label>
                <Controller
                  control={control}
                  name="clinicalRole"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-labelledby="role-label" className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
                <p className="text-[13px] font-semibold text-slate-900">Clinical terms</p>
                {(
                  [
                    ["termsAccepted", "I accept the clinical terms, expected response times and coverage obligations."],
                    ["safetyAlertsAccepted", "I agree to receive critical safety alerts as defined during onboarding."],
                    ["monitoringNoticeAccepted", "I understand messaging is not monitored 24/7 and patients must use the clinic emergency number."],
                  ] as const
                ).map(([name, label]) => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <div>
                        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-5 text-slate-700">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            onBlur={field.onBlur}
                            aria-invalid={Boolean(fieldState.error)}
                            className="mt-0.5"
                          />
                          <span>{label}</span>
                        </label>
                        {fieldState.error && <p role="alert" className="ml-7 mt-1 text-xs font-medium text-red-700">{fieldState.error.message}</p>}
                      </div>
                    )}
                  />
                ))}
              </div>

              <FormAlert message={serverError} />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" size="lg" onClick={() => setStep(0)} disabled={isSubmitting}>
                  <ArrowLeft size={16} aria-hidden /> Back
                </Button>
                <Button type="submit" size="lg" loading={isSubmitting} className="flex-1">
                  {isSubmitting ? "Submitting…" : "Create account"}
                </Button>
              </div>
            </motion.fieldset>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
        Already approved?{" "}
        <Link href="/signin" className="font-semibold text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
