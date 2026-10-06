import { z } from "zod";

/** Mirrors the backend rule (8 characters minimum; bcrypt reads at most 72 bytes). The backend stays authoritative. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 72;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
      .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES, "That password is too long."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "The two passwords do not match." });

export const forgotSchema = z.object({
  email: z.string().trim().min(1, "Enter your work email.").email("Enter a valid email address."),
});

/** Shown whatever the account state is: the backend never says whether the address exists. */
export const FORGOT_PASSWORD_NOTICE = "If an account exists for this email, you will receive a password reset link.";
