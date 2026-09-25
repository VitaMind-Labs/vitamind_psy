"use client";

import { forwardRef, useId, useState, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<InputProps, "id"> {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  /** Renders a show/hide toggle and switches the input type. */
  revealable?: boolean;
  labelAside?: ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, optional, revealable, labelAside, type, className, ...props }, ref) => {
    const id = useId();
    const [revealed, setRevealed] = useState(false);
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="text-[13px] font-medium text-slate-900">
            {label}
            {optional && <span className="ml-1 font-normal text-slate-500">(optional)</span>}
          </label>
          {labelAside}
        </div>
        <Input
          ref={ref}
          id={id}
          type={revealable ? (revealed ? "text" : "password") : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("h-11", className)}
          trailing={
            revealable ? (
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                aria-label={revealed ? "Hide password" : "Show password"}
                aria-pressed={revealed}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {revealed ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            ) : undefined
          }
          {...props}
        />
        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${id}-error`}
              role="alert"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 text-xs font-medium text-red-700"
            >
              <AlertCircle size={13} aria-hidden className="shrink-0" />
              {error}
            </motion.p>
          ) : hint ? (
            <motion.div key="hint" id={`${id}-hint`} className="text-xs text-slate-500">
              {hint}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  },
);

AuthField.displayName = "AuthField";

export function FormAlert({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
            <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
            <span className="leading-snug">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
