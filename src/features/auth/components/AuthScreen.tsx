"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft, ArrowRight, Lock, Mail, Smartphone } from "lucide-react";
import { loginPsychologist, verifyPsychologist2fa } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthField, FormAlert } from "@/features/auth/components/AuthField";
import { PsyTwoFactorSetup } from "@/features/auth/components/PsyTwoFactorSetup";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your work email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

type Step = "credentials" | "verify" | "setup";

const RECOVERY_RE = /^[A-Z2-9]{4}-[A-Z2-9]{4}$/;

function formatRecoveryCode(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export default function AuthScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("credentials");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState<string | null>(null);

  const [verifyCode, setVerifyCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const finish = () => {
    router.replace("/dashboard");
    router.refresh();
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    const result = await loginPsychologist(email, password);
    if ("requires2fa" in result) {
      setTempToken(result.tempToken);
      setStep("verify");
      return;
    }
    if ("requires2faSetup" in result) {
      setSetupToken(result.setupToken);
      setStep("setup");
      return;
    }
    if (!result.success) {
      setServerError(result.error || "Unable to sign in. Please try again.");
      return;
    }
    finish();
  });

  const verify = async (token: string) => {
    if (!tempToken) return;
    const normalized = token.trim().toUpperCase();
    const valid = /^\d{6}$/.test(normalized) || RECOVERY_RE.test(normalized);
    if (!valid || verifying) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyPsychologist2fa(tempToken, normalized);
      if (!result.success) {
        setVerifyError(result.error);
        setVerifyCode("");
        return;
      }
      finish();
    } finally {
      setVerifying(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setTempToken(null);
    setSetupToken(null);
    setVerifyCode("");
    setRecoveryInput("");
    setUseRecoveryCode(false);
    setVerifyError(null);
    setServerError(null);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-[380px] space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8"
    >
      {step === "credentials" && (
        <>
          <header className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sign in</h1>
            <p className="text-sm text-slate-600">Use your clinician account.</p>
          </header>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <AuthField
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@clinic.com"
              icon={<Mail size={16} />}
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <AuthField
              label="Password"
              revealable
              autoComplete="current-password"
              placeholder="Enter your password"
              icon={<Lock size={16} />}
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <FormAlert message={serverError} />

            <Button type="submit" size="lg" loading={isSubmitting} className="group h-11 w-full text-[15px]">
              {isSubmitting ? "Signing in…" : "Continue"}
              {!isSubmitting && <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            <Link href="/forgot-password" className="font-medium text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline">
              Forgot your password?
            </Link>
          </p>

          <div className="border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
            New to SynQ?{" "}
            <Link href="/signup" className="font-semibold text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline">
              Request clinician access
            </Link>
          </div>
        </>
      )}

      {step === "verify" && (
        <>
          <header className="space-y-2.5">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
              <Smartphone size={20} aria-hidden />
            </span>
            <h1 className="pt-1 text-2xl font-semibold tracking-tight text-slate-900">Two-factor verification</h1>
            <p className="text-sm text-slate-600">
              {useRecoveryCode
                ? "Enter one of the recovery codes saved at setup. Each code works once."
                : "Enter the 6-digit code from your authenticator app."}
            </p>
          </header>

          {useRecoveryCode ? (
            <div className="space-y-1.5">
              <label htmlFor="recovery-code" className="text-[13px] font-medium text-slate-900">
                Recovery code
              </label>
              <Input
                id="recovery-code"
                autoFocus
                autoComplete="one-time-code"
                placeholder="XXXX-XXXX"
                value={recoveryInput}
                onChange={(e) => setRecoveryInput(formatRecoveryCode(e.target.value))}
                disabled={verifying}
                className="h-11 text-center font-mono text-[15px] tracking-[0.2em]"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={verifyCode}
                onChange={setVerifyCode}
                onComplete={verify}
                disabled={verifying}
                autoFocus
                aria-label="6-digit verification code"
              >
                <InputOTPGroup>
                  {[0, 1, 2].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
                <span className="text-slate-400" aria-hidden>
                  –
                </span>
                <InputOTPGroup>
                  {[3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <FormAlert message={verifyError} />

          <div className="space-y-2">
            <Button
              size="lg"
              loading={verifying}
              disabled={useRecoveryCode ? !RECOVERY_RE.test(recoveryInput) : verifyCode.length !== 6}
              onClick={() => verify(useRecoveryCode ? recoveryInput : verifyCode)}
              className="h-11 w-full"
            >
              Verify and continue
            </Button>
            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode((v) => !v);
                setVerifyError(null);
              }}
              disabled={verifying}
              className="w-full cursor-pointer py-1 text-center text-[13px] font-medium text-teal-700 transition-colors hover:text-teal-800 hover:underline disabled:opacity-50"
            >
              {useRecoveryCode ? "Use the authenticator code instead" : "Lost your authenticator? Use a recovery code"}
            </button>
            <Button variant="secondary" onClick={backToCredentials} disabled={verifying} className="w-full">
              <ArrowLeft size={16} aria-hidden /> Use a different account
            </Button>
          </div>
        </>
      )}

      {step === "setup" && setupToken && (
        <>
          <header className="space-y-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Set up two-factor authentication</h1>
            <p className="text-sm text-slate-600">
              Two-factor authentication protects patient data. Enrol an authenticator app to continue.
            </p>
          </header>
          <PsyTwoFactorSetup bearer={setupToken} onComplete={finish} onCancel={backToCredentials} />
        </>
      )}
    </motion.div>
  );
}
