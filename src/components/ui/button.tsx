"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "text-white",
        secondary:
          "bg-white border",
        ghost:
          "bg-transparent hover:bg-[var(--surface-secondary)]",
        outline:
          "bg-transparent border",
        danger:
          "text-white",
      },
      size: {
        sm: "h-9 px-3 text-xs rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
        default: "h-11 px-5 text-sm rounded-[var(--radius-sm)]",
        lg: "h-13 px-7 text-base rounded-[var(--radius-md)]",
        icon: "h-10 w-10 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const style: React.CSSProperties = {};
    if (variant === "primary" || variant === "danger") {
      style.background =
        variant === "danger"
          ? "var(--danger)"
          : "var(--gradient-primary)";
    }
    if (variant === "secondary" || variant === "outline") {
      style.borderColor = "var(--border)";
      style.color = "var(--foreground)";
    }
    if (variant === "ghost") {
      style.color = "var(--foreground-muted)";
    }
    return (
      <Comp
        ref={ref}
        className={`${buttonVariants({ variant, size })} ${className}`}
        style={style}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
