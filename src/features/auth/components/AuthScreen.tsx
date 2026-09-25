"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { loginPsychologist } from "@/features/auth/actions/auth";
import { Button } from "@/components/ui/button";
import { AuthField, FormAlert } from "@/features/auth/components/AuthField";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your work email.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function AuthScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    const result = await loginPsychologist(email, password);
    if (!result.success) {
      setServerError(result.error || "Unable to sign in. Please try again.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  });

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-[400px]"
    >
      <header>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-600">Access your secure clinical workspace.</p>
      </header>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <AuthField
          label="Work email"
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

        <Button type="submit" size="lg" loading={isSubmitting} className="group w-full">
          {isSubmitting ? "Signing in…" : "Continue"}
          {!isSubmitting && <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Forgot your password? Contact your clinic administrator.
      </p>

      <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
        New to VitaMind?{" "}
        <Link href="/signup" className="font-semibold text-teal-700 underline-offset-4 hover:text-teal-800 hover:underline">
          Request clinician access
        </Link>
      </div>
    </motion.div>
  );
}
