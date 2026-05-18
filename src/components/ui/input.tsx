"use client";

import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--foreground-soft)" }}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`input-ui h-11 ${icon ? "pl-10" : "px-4"} pr-4 rounded-[var(--radius-sm)] text-sm ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
