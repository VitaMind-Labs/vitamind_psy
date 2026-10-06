import type { Metadata } from "next";
import ForgotPasswordScreen from "@/features/auth/components/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Forgot password | VitaMind",
  description: "Request a link to reset your VitaMind clinician password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
