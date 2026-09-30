"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Determine if it's a 403 error based on the error message
  const isForbidden = error.message?.toLowerCase().includes("403") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("unauthorized");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--background] px-4 py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <Image
            src="/logo.svg"
            alt=""
            width={48}
            height={48}
            className="h-20 w-20 object-contain"
            priority
          />
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold tracking-tight text-[--danger]">
          {isForbidden ? "403" : "Error"}
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[--foreground]">
            {isForbidden ? "Access Forbidden" : "Something Went Wrong"}
          </h2>
          <p className="text-sm text-[--foreground-muted]">
            {isForbidden 
              ? "You do not have permission to access this page." 
              : "An unexpected error occurred. Please try again later."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[--brand] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[--brand-strong]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-5 py-3 text-sm font-semibold text-[--foreground] transition hover:bg-[--surface-secondary]"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
