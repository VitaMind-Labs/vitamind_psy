import type { Metadata } from "next";
import ResetPasswordScreen from "@/features/auth/components/ResetPasswordScreen";
import { passwordResetApi } from "@/lib/api/password-reset";

export const metadata: Metadata = {
  title: "Reset password | SynQ",
  description: "Choose a new password for your SynQ clinician account.",
  robots: { index: false, follow: false },
  // The link carries a one-time secret: it must never leave in a Referer header.
  referrer: "no-referrer",
};

/** Not signed in on purpose: no session, no refresh. The link is checked once, on the server, before anything renders. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" && /^[A-Za-z0-9_-]{43}$/.test(raw) ? raw : null;
  const usable = token ? (await passwordResetApi.verify(token)).ok : false;
  return <ResetPasswordScreen token={usable ? token : null} />;
}
