"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] w-full flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] bg-[#090E1A]/95 backdrop-blur-xl border border-white/[0.12] p-8 shadow-glass-3 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-white">
              Set New Password
            </h1>
            <p className="text-xs text-slate-300">
              Enter your new secure password below to restore access to your VIRA account.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center p-6 space-y-3 bg-desk-teal/10 rounded-2xl border border-desk-teal/30">
              <CheckCircle2 className="h-8 w-8 text-desk-teal mx-auto" />
              <p className="text-sm font-medium text-white">Password Updated Successfully!</p>
              <p className="text-xs text-slate-300">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:border-desk-amber focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:border-desk-amber focus:outline-none"
                />
              </div>

              <GlassButton
                variant="accent"
                size="md"
                type="submit"
                isLoading={loading}
                className="w-full py-3 mt-2"
              >
                <span>Save New Password</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </GlassButton>
            </form>
          )}

          <div className="pt-2 text-center border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
              <Shield className="h-3 w-3 text-desk-amber" />
              <span>Encrypted with Supabase Auth</span>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
