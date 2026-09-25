"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950",
        brand: "bg-teal-700 text-white shadow-sm hover:bg-teal-800",
        secondary: "border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        outline: "border border-slate-200 bg-transparent text-slate-900 hover:border-slate-300 hover:bg-slate-50",
        danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        link: "h-auto px-0 text-teal-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-10 rounded-xl px-4 text-sm",
        default: "h-10 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-xl px-6 text-sm",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";
