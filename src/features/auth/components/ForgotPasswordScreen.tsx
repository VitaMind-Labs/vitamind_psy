"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, MailCheck, Mail } from "lucide-react";
import { z } from "zod";
import { requestPasswordReset } from "@/features/auth/actions/password-reset";
import { FORGOT_PASSWORD_NOTICE, forgotSchema } from "@/features/auth/password";
import { AuthField, FormAlert } from "@/features/auth/components/AuthField";
import { Button } from "@/components/ui/button";

type Values = z.infer<typeof forgotSchema>;

/** The resend button waits this long so a legitimate retry is possible without inviting hammering. */
const RESEND_AFTER_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(forgotSchema), mode: "onTouched", defaultValues: { email: "" } });

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const send = async (email: string) => {
    setServerError(null);
    const result = await requestPasswordReset(email);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSentTo(email);
    setWait(RESEND_AFTER_SECONDS);
  };

  const onSubmit = handleSubmit(({ email }) => send(email));

  return (
    <div className="w-full max-w-[380px] space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      {sentTo ? (
        <>
          <header className="space-y-2.5">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
              <MailCheck size={20} aria-hidden />
            </span>
            <h1 className="pt-1 text-2xl font-semibold tracking-tight text-slate-900">Check your email</h1>
            <p role="status" className="text-sm text-slate-600">
              {FORGOT_PASSWORD_NOTICE} The link works once and expires soon.
            </p>
          </header>
          <FormAlert message={serverError} />
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" disabled={wait > 0} onClick={() => void send(sentTo)}>
              {wait > 0 ? `Send again in ${wait}s` : "Send the email again"}
            </Button>
            <Link
              href="/signin"
              className="flex w-full items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-teal-700 hover:text-teal-800 hover:underline"
            >
              <ArrowLeft size={14} aria-hidden /> Back to sign in
            </Link>
          </div>
        </>
      ) : (
        <>
          <header className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Forgot your password?</h1>
            <p className="text-sm text-slate-600">Enter your work email and we will send you a link to choose a new one.</p>
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
            <FormAlert message={serverError} />
            <Button type="submit" size="lg" loading={isSubmitting} className="group h-11 w-full text-[15px]">
              {isSubmitting ? "Sending…" : "Send reset link"}
              {!isSubmitting && <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>

          <Link
            href="/signin"
            className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-teal-700 hover:text-teal-800 hover:underline"
          >
            <ArrowLeft size={14} aria-hidden /> Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
