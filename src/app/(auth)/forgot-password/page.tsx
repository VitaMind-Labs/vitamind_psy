import type { Metadata } from "next";
import ForgotPasswordScreen from "@/features/auth/components/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Forgot password | SynQ",
  description: "Request a link to reset your SynQ clinician password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
