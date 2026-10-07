import AuthScreen from "@/features/auth/components/AuthScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | SynQ",
  description: "Secure sign in experience for SynQ users.",
};

export default function SignInPage() {
  return <AuthScreen />;
}
