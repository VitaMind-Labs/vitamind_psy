import type { Metadata } from "next";
import { SignupScreen } from "@/features/auth/components/SignupScreen";

export const metadata: Metadata = {
  title: "Clinician sign up | VitaMind",
  description: "Request secure access to the VitaMind clinical space.",
};

export default function SignupPage() {
  return <SignupScreen />;
}
