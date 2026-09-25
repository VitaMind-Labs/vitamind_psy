import AuthScreen from "@/features/auth/components/AuthScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | VitaMind",
  description: "Secure sign in experience for VitaMind users.",
};

export default function SignInPage() {
  return <AuthScreen />;
}
