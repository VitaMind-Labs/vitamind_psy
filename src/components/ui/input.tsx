"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  /** Trailing adornment, e.g. a password visibility toggle. */
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, icon, trailing, ...props }, ref) => (
  <div className="relative w-full">
    {icon && (
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
    )}
    <input
      ref={ref}
      className={cn("input-ui h-11 rounded-xl text-sm", icon ? "pl-10" : "pl-3.5", trailing ? "pr-11" : "pr-3.5", className)}
      {...props}
    />
    {trailing && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</span>}
  </div>
));

Input.displayName = "Input";
