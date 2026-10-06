"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Lock, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { completePasswordReset } from "@/features/auth/actions/password-reset";
import { newPasswordSchema, PASSWORD_MIN } from "@/features/auth/password";
import { AuthField, FormAlert } from "@/features/auth/components/AuthField";
import { Button } from "@/components/ui/button";

type Values = z.infer<typeof newPasswordSchema>;

/**
 * `token` is null when the server already found the link unusable (missing, malformed, expired, used).
 * The token travelled in the URL once; it is removed from the address bar so it is not kept in history.
 */
export default function ResetPasswordScreen({ token }: { token: string | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [expired, setExpired] = useState(token === null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(newPasswordSchema), mode: "onTouched", defaultValues: { password: "", confirmPassword: "" } });

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const onSubmit = handleSubmit(async ({ password, confirmPassword }) => {
    if (!token) return;
    setServerError(null);
    const result = await completePasswordReset(token, password, confirmPassword);
    if (result.success) return setDone(true);
    if (result.expired) return setExpired(true);
    setServerError(result.error);
  });

  return (
    <div className="w-full max-w-[380px] space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      {done ? (
        <>
          <header className="space-y-2.5">
            <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/15">
              <CheckCircle2 size={20} aria-hidden />
            </span>
            <h1 className="pt-1 text-2xl font-semibold tracking-tight text-slate-900">Password changed</h1>
            <p role="status" className="text-sm text-slate-600">
              Your password was updated and every device was signed out. Sign in with your new password.
            </p>
          </header>
          <Button asChild size="lg" className="h-11 w-full text-[15px]">
            <Link href="/signin">Go to sign in</Link>
          </Button>
        </>
      ) : expired ? (
        <>
          <header className="space-y-2.5">
            <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15">
              <TriangleAlert size={20} aria-hidden />
            </span>
            <h1 className="pt-1 text-2xl font-semibold tracking-tight text-slate-900">This link no longer works</h1>
            <p role="alert" className="text-sm text-slate-600">
              The reset link is invalid, was already used, or has expired. Request a new one to continue.
            </p>
          </header>
          <Button asChild size="lg" className="h-11 w-full text-[15px]">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Link href="/signin" className="block text-center text-[13px] font-medium text-teal-700 hover:text-teal-800 hover:underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <header className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
            <p className="text-sm text-slate-600">Use at least {PASSWORD_MIN} characters. You will be signed out everywhere.</p>
          </header>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <AuthField
              label="New password"
              revealable
              autoComplete="new-password"
              placeholder="At least 8 characters"
              icon={<Lock size={16} />}
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />
            <AuthField
              label="Confirm new password"
              revealable
              autoComplete="new-password"
              placeholder="Repeat the password"
              icon={<Lock size={16} />}
              disabled={isSubmitting}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <FormAlert message={serverError} />
            <Button type="submit" size="lg" loading={isSubmitting} className="group h-11 w-full text-[15px]">
              {isSubmitting ? "Saving…" : "Change password"}
              {!isSubmitting && <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
