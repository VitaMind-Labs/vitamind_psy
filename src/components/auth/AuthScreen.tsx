"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function AuthScreen() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#f8faf9]">
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] h-[500px] w-[500px] rounded-full bg-[#518591]/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[450px] w-[450px] rounded-full bg-[#e3b01c]/10 blur-3xl" />
      </div>

      {/* LEFT BRAND PANEL */}
      <div className="relative hidden w-[52%] lg:flex flex-col justify-between border-r border-black/5 bg-[#f4f7f6] p-14">
        {/* top */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            {/* logo container */}
            <div className="relative flex h-18 w-18 items-center justify-center rounded-3xl bg-white shadow-[0_20px_60px_rgba(81,133,145,0.15)] ring-1 ring-black/5">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#518591]/10 to-[#e3b01c]/10" />

              <Image
                src="/logo.png"
                alt="VitaMind"
                width={42}
                height={42}
                priority
                className="relative object-contain"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1f2e2b]">
                Vita<span className="text-[#e3b01c]">Mind</span>
              </h1>

              <p className="mt-1 text-sm text-[#1f2e2b]/45">
                AI Clinical Intelligence
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-24 max-w-xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#518591]/10 bg-white px-4 py-2 shadow-sm">
              <ShieldCheck size={15} className="text-[#518591]" />

              <span className="text-xs font-semibold tracking-[0.18em] text-[#518591] uppercase">
                Trusted Mental Platform
              </span>
            </div>

            <h2 className="text-6xl font-bold leading-[1.05] tracking-[-0.04em] text-[#1f2e2b]">
              Modern Care
              <br />
              For Modern
              <br />
              Psychiatry.
            </h2>

            <p className="mt-7 max-w-lg text-lg leading-relaxed text-[#1f2e2b]/55">
              Unified platform for intelligent patient monitoring, clinical
              workflows and AI-assisted mental healthcare.
            </p>
          </motion.div>
        </div>

        {/* bottom */}
        <div className="flex gap-4">
          {["AI Monitoring", "Clinical Reports", "Secure Infrastructure"].map(
            (item) => (
              <div
                key={item}
                className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
              >
                <p className="text-sm font-medium text-[#1f2e2b]/70">{item}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* RIGHT AUTH PANEL */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* mobile brand */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <Image
              src="/logo.png"
              alt="VitaMind"
              width={42}
              height={42}
              priority
            />

            <h1 className="text-2xl font-bold text-[#1f2e2b]">
              Vita<span className="text-[#e3b01c]">Mind</span>
            </h1>
          </div>

          <div className="rounded-[32px] border border-black/5 bg-white/90 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.06)] backdrop-blur-xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#518591]">
                Practitioner Access
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#1f2e2b]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#1f2e2b]/45">
                Access your secure psychiatrist workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                placeholder="Professional email"
                required
                className="h-14 w-full rounded-2xl border border-black/8 bg-[#f9fbfa] px-5 text-sm text-[#1f2e2b] outline-none transition-all focus:border-[#518591] focus:bg-white"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="h-14 w-full rounded-2xl border border-black/8 bg-[#f9fbfa] px-5 pr-12 text-sm text-[#1f2e2b] outline-none transition-all focus:border-[#518591] focus:bg-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1f2e2b]/35 transition hover:text-[#518591]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#1f2e2b]/50">
                  <input type="checkbox" className="accent-[#518591]" />
                  Remember me
                </label>

                <button
                  type="button"
                  className="font-medium text-[#518591] transition hover:text-[#1f2e2b]"
                >
                  Forgot password
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#518591] to-[#2c3e3b] text-sm font-semibold text-white shadow-xl shadow-[#518591]/20 transition-all hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Continue
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}