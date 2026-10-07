import type { Metadata } from "next";
import { SignupScreen } from "@/features/auth/components/SignupScreen";

export const metadata: Metadata = {
  title: "Clinician sign up | SynQ",
  description: "Request secure access to the SynQ clinical space.",
};

export default function SignupPage() {
  return <SignupScreen />;
}
