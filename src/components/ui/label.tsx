"use client";

import { forwardRef } from "react";

export const Label = forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium block mb-1.5 ${className}`}
    style={{ color: "var(--foreground-secondary)" }}
    {...props}
  />
));
Label.displayName = "Label";
