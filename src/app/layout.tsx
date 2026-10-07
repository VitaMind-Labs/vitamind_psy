import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SynQ Psy", template: "%s | SynQ Psy" },
  description: "Clinical workspace for psychologists and psychiatrists.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body className="bg-white antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
