"use client";

import { useEffect, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Check, Copy, Download, KeyRound, ScanLine, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { confirmPsychologist2fa, enablePsychologist2fa } from "@/features/auth/actions/auth";
import type { TwoFactorEnrollment } from "@/lib/api/psychologist";
import { FormAlert } from "@/features/auth/components/AuthField";
import { cn } from "@/lib/utils";

const STEPS = ["Scan QR", "Verify code", "Save backup codes"];

/**
 * Clinician TOTP enrolment wizard. Pass the setup token on the sign-in path;
 * omit it in-session (the session bearer is attached automatically).
 * Recovery codes are issued exactly once and must be saved before closing.
 */
export function PsyTwoFactorSetup({
  bearer,
  onComplete,
  onCancel,
}: {
  bearer?: string;
  onComplete: () => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    let cancelled = false;
    enablePsychologist2fa(bearer).then((result) => {
      if (cancelled) return;
      if (result.success) setEnrollment(result.enrollment);
      else setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch only on explicit retry; the bearer is fixed for the wizard lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const confirm = async (token: string) => {
    if (token.length !== 6 || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await confirmPsychologist2fa(token, bearer);
      if (!result.success) {
        setError(result.error);
        setCode("");
        return;
      }
      setBackupCodes(result.backupCodes);
      setStep(2);
      toast.success("Authenticator verified — save your recovery codes to finish.");
    } finally {
      setPending(false);
    }
  };

  const copyKey = async () => {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 1500);
    } catch {
      toast.error("Could not copy — select the key manually.");
    }
  };

  const copyAll = async () => {
    if (!backupCodes?.length) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {
      toast.error("Could not copy — select the codes manually.");
    }
  };

  const download = () => {
    if (!backupCodes?.length) return;
    const body = [
      "VitaMind — two-factor recovery codes",
      "Each code signs you in once if you lose your authenticator. Store them somewhere safe.",
      "",
      ...backupCodes,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vitamind-recovery-codes.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <FormAlert message={loadError} />
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              setLoadError(null);
              setEnrollment(null);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none">
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                  done && "bg-slate-900 text-white",
                  active && "bg-teal-50 text-teal-700 ring-1 ring-teal-600/40",
                  !done && !active && "bg-slate-100 text-slate-400",
                )}
              >
                {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className={cn("truncate text-xs", active ? "font-semibold text-slate-900" : "text-slate-500")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className={cn("h-px min-w-4 flex-1", done || active ? "bg-slate-900" : "bg-slate-200")} aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ScanLine size={16} aria-hidden className="text-teal-700" />
              Scan this QR code with your authenticator app
            </p>
            <p className="text-[13px] text-slate-500">Google Authenticator, 1Password, Apple Passwords — any TOTP app works.</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:flex-row sm:items-start">
            {enrollment ? (
              // Data URL generated by the backend (qrcode.toDataURL); not a remote image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={enrollment.qr_code} alt="Two-factor authentication QR code" className="size-36 shrink-0 rounded-lg border border-slate-200 bg-white p-1.5" />
            ) : (
              <span aria-label="Loading QR code" className="size-36 shrink-0 animate-pulse rounded-lg bg-slate-200/70" />
            )}
            <div className="min-w-0 space-y-1.5 text-center sm:text-left">
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:justify-start">
                <KeyRound size={14} aria-hidden /> Or enter this key manually
              </p>
              {enrollment ? (
                <button
                  type="button"
                  onClick={copyKey}
                  title="Copy setup key"
                  className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  <span className="truncate">{enrollment.secret}</span>
                  {keyCopied ? <Check size={14} aria-hidden className="shrink-0 text-emerald-600" /> : <Copy size={14} aria-hidden className="shrink-0" />}
                </button>
              ) : (
                <span className="block h-4 w-40 animate-pulse rounded bg-slate-200/70" aria-hidden />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={() => setStep(1)} disabled={!enrollment} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Smartphone size={16} aria-hidden className="text-teal-700" />
              Enter the 6-digit code your app shows
            </p>
            <p className="text-[13px] text-slate-500">Codes rotate every 30 seconds — any current code works.</p>
          </div>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={setCode}
              onComplete={confirm}
              disabled={!enrollment || pending}
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
          <FormAlert message={error} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)} disabled={pending} className="flex-1">
              Back
            </Button>
            <Button onClick={() => confirm(code)} loading={pending} disabled={code.length !== 6 || !enrollment} className="flex-1">
              Verify and continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck size={16} aria-hidden className="text-teal-700" />
              Save your recovery codes
            </p>
            <p className="text-[13px] leading-5 text-slate-500">
              Each code signs you in once if you lose your authenticator. They are shown{" "}
              <strong className="font-semibold text-slate-700">only now</strong> — we store hashes, never the codes themselves.
            </p>
          </div>
          <ol className="grid grid-cols-2 gap-2" aria-label="Recovery codes">
            {(backupCodes ?? []).map((c) => (
              <li
                key={c}
                className="rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2 text-center font-mono text-[13px] font-medium tracking-wider text-slate-900"
              >
                {c}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copyAll} disabled={!backupCodes?.length} className="flex-1">
              {copiedAll ? <Check size={16} aria-hidden className="text-emerald-600" /> : <Copy size={16} aria-hidden />}
              {copiedAll ? "Copied!" : "Copy all"}
            </Button>
            <Button variant="secondary" onClick={download} disabled={!backupCodes?.length} className="flex-1">
              <Download size={16} aria-hidden />
              Download (.txt)
            </Button>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] leading-5 text-slate-500 transition-colors has-checked:border-teal-600/40 has-checked:bg-teal-50/50 has-checked:text-slate-700">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-teal-700"
            />
            <span>I stored these codes somewhere safe. I understand they will never be shown again.</span>
          </label>
          <Button onClick={onComplete} disabled={!acknowledged} className="w-full">
            Done — finish setup
          </Button>
        </div>
      )}
    </div>
  );
}
