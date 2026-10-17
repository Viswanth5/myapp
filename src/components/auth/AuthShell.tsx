"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { AuthInput } from "./AuthInput";
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
} from "lucide-react";

export type AuthMode = "signin" | "signup" | "forgot";

interface AuthShellProps {
  initialMode?: AuthMode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  initialMode = "signin",
}) => {
  const router = useRouter();
  const mode = initialMode;

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const supabase = createClient();

  /* ================= PASSWORD STRENGTH CALCULATION ================= */
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const strengthLabels = ["Too Short", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-rose-500",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-desk-teal",
  ];

  const isPasswordMatch =
    password && confirmPassword && password === confirmPassword;

  /* ================= SUBMIT HANDLERS ================= */

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) throw authError;

      // Check onboarding state
      const isOnboarded = data.user?.user_metadata?.isOnboarded;
      if (isOnboarded === false) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(
        err.message || "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError("Please provide your full name.");
      return;
    }
    if (!cleanEmail) {
      setError("Please provide your university or personal email.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      // 1. Call server route with Service Role Key for auto-confirmed student signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: cleanName,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to create account.");
      }

      // 2. Sign in immediately to establish client session cookie
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        router.push("/login?created=true");
        return;
      }

      // 3. Immediately route to Onboarding questionnaire for setup & daily activities
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please provide your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: any) {
      setError(err.message || "Unable to send password recovery instructions.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || "Google authentication could not be initiated.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[92vh] w-full flex items-center justify-center py-8 px-4 sm:px-6">
      {/* High-Performance GPU Radial Gradients (Replaces heavy blurs, 100% lag-free) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 550px 380px at 20% 25%, rgba(224, 164, 88, 0.12), transparent 75%), radial-gradient(ellipse 550px 420px at 80% 75%, rgba(31, 111, 107, 0.16), transparent 75%)",
        }}
      />

      <div className="w-full max-w-[440px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[32px] sm:rounded-[36px] bg-[#090E1A]/92 backdrop-blur-xl border border-white/[0.12] p-7 sm:p-9 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(224,164,88,0.06)] overflow-hidden transform-gpu"
        >
          {/* Specular Edge Highlights */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Luxury Brand Monogram & Header */}
          <div className="text-center space-y-3.5 mb-7">
            <div className="inline-flex relative group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.16] via-white/[0.04] to-transparent border border-white/[0.2] shadow-[0_0_25px_rgba(224,164,88,0.2)] group-hover:scale-105 transition-transform duration-300">
                <span className="font-serif text-2xl font-bold bg-gradient-to-tr from-white via-amber-100 to-desk-amber bg-clip-text text-transparent">
                  V
                </span>
              </div>
              <div className="absolute -inset-2 rounded-2xl bg-desk-amber/20 blur-md -z-10 group-hover:bg-desk-amber/30 transition-colors" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono tracking-widest text-desk-amber uppercase mb-2.5">
                <Sparkles className="h-2.5 w-2.5 text-desk-amber" />
                <span>Intelligent Student Life-OS</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
                {mode === "signin" && (
                  <>
                    Welcome{" "}
                    <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-desk-amber via-amber-200 to-amber-400">
                      Back
                    </span>
                  </>
                )}
                {mode === "signup" && (
                  <>
                    Begin Your{" "}
                    <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-desk-amber via-amber-200 to-amber-400">
                      Journey
                    </span>
                  </>
                )}
                {mode === "forgot" && (
                  <>
                    Reset Your{" "}
                    <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-desk-amber via-amber-200 to-amber-400">
                      Password
                    </span>
                  </>
                )}
              </h1>

              <p className="font-sans text-xs text-slate-400/90 mt-2 leading-relaxed max-w-xs mx-auto">
                {mode === "signin" &&
                  "Enter your credentials to enter your coursework, habits & daily workspace."}
                {mode === "signup" &&
                  "Create your account to organize coursework, deadlines & daily atomic habits."}
                {mode === "forgot" &&
                  "Enter your registered email and we'll dispatch password recovery instructions."}
              </p>
            </div>
          </div>

          {/* Inline Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden mb-5"
              >
                <div className="flex items-start gap-2.5 text-xs text-rose-200 bg-rose-500/[0.1] border border-rose-500/30 p-3.5 rounded-2xl backdrop-blur-md shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= 1. DEDICATED SIGN IN VIEW ================= */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <AuthInput
                label="Email Address"
                microLabel="STUDENT IDENTIFIER"
                type="email"
                icon={Mail}
                required
                disabled={loading}
                autoComplete="email"
                placeholder="name@university.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AuthInput
                label="Master Password"
                microLabel="SECURITY KEY"
                icon={Lock}
                isPassword
                required
                disabled={loading}
                autoComplete="current-password"
                placeholder="Enter security key • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightAction={
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-desk-amber/90 hover:text-amber-200 transition-colors group cursor-pointer"
                  >
                    <span>Forgot?</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-[10px]">→</span>
                  </Link>
                }
              />

              {/* Primary Luxury Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#F5BB73] via-desk-amber to-[#CD8B3C] hover:brightness-110 active:scale-[0.985] text-canvas-950 font-sans font-bold text-sm shadow-[0_10px_30px_-5px_rgba(224,164,88,0.5)] border border-amber-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none will-change-transform"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-canvas-950 border-t-transparent" />
                    <span>Verifying session...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>

              {/* Hairline Divider (Clean Flex Layout without box shadow artifacts) */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.14] to-white/[0.08]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 select-none whitespace-nowrap">
                  or continue with
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-white/[0.14] to-white/[0.08]" />
              </div>

              {/* Google OAuth Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] hover:border-white/[0.22] hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all text-xs font-medium flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 select-none shadow-sm"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </motion.button>

              {/* Direct Link to Sign Up */}
              <div className="text-center pt-3 mt-4 border-t border-white/[0.08]">
                <p className="text-xs text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-desk-amber hover:text-amber-300 font-semibold hover:underline underline-offset-4 transition-colors ml-1 inline-flex items-center gap-1 group"
                  >
                    <span>Create an account</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ================= 2. DEDICATED SIGN UP VIEW ================= */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <AuthInput
                label="Full Name"
                microLabel="FULL IDENTITY"
                icon={User}
                required
                disabled={loading}
                autoComplete="name"
                placeholder="e.g. Alex Morgan or your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <AuthInput
                label="Email Address"
                microLabel="CAMPUS / PERSONAL"
                type="email"
                icon={Mail}
                required
                disabled={loading}
                autoComplete="email"
                placeholder="name@university.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <AuthInput
                label="Create Password"
                microLabel="MIN. 6 CHARACTERS"
                icon={Lock}
                isPassword
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Create security key • • • • •"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <AuthInput
                label="Confirm Password"
                microLabel="VERIFY CREDENTIAL"
                icon={ShieldCheck}
                isPassword
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Re-enter security key • • • • •"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {/* Dynamic Password Strength & Match Feedback */}
              <div className="space-y-1.5 px-0.5 pt-1 text-xs">
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className="text-slate-400">Security strength:</span>
                      <span
                        className={`font-medium ${
                          strengthScore <= 1
                            ? "text-rose-400"
                            : strengthScore === 2
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {strengthLabels[strengthScore - 1] || "Weak"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= step
                              ? strengthColors[strengthScore - 1]
                              : "bg-white/[0.1]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {isPasswordMatch && (
                  <div className="text-emerald-400 text-[11px] flex items-center gap-1 pt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              {/* Primary Luxury Create Account Button */}
              <motion.button
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#F5BB73] via-desk-amber to-[#CD8B3C] hover:brightness-110 active:scale-[0.985] text-canvas-950 font-sans font-bold text-sm shadow-[0_10px_30px_-5px_rgba(224,164,88,0.5)] border border-amber-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none will-change-transform"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-canvas-950 border-t-transparent" />
                    <span>Initializing account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>

              {/* Hairline Divider (Clean Flex Layout without box shadow artifacts) */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.14] to-white/[0.08]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 select-none whitespace-nowrap">
                  or sign up with
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-white/[0.14] to-white/[0.08]" />
              </div>

              {/* Google OAuth Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] hover:border-white/[0.22] hover:shadow-[0_0_25px_rgba(255,255,255,0.06)] transition-all text-xs font-medium flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 select-none shadow-sm"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </motion.button>

              {/* Direct Link to Sign In */}
              <div className="text-center pt-3 mt-3 border-t border-white/[0.08]">
                <p className="text-xs text-slate-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-desk-amber hover:text-amber-300 font-semibold hover:underline underline-offset-4 transition-colors ml-1 inline-flex items-center gap-1 group"
                  >
                    <span>Sign in</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ================= 3. DEDICATED FORGOT PASSWORD VIEW ================= */}
          {mode === "forgot" && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="rounded-2xl bg-teal-500/[0.08] border border-teal-500/25 p-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-white">
                    Reset link dispatched
                  </h3>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed">
                    Check your inbox at{" "}
                    <span className="font-mono text-white font-medium">
                      {email}
                    </span>
                    . Follow the secure link to set your new password.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 text-xs font-semibold text-desk-amber hover:underline underline-offset-4 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Return to Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <AuthInput
                    label="Registered Email"
                    microLabel="RECOVERY DESTINATION"
                    type="email"
                    icon={Mail}
                    required
                    disabled={loading}
                    autoComplete="email"
                    placeholder="name@university.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <motion.button
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#F5BB73] via-desk-amber to-[#CD8B3C] hover:brightness-110 active:scale-[0.985] text-canvas-950 font-sans font-bold text-sm shadow-[0_10px_30px_-5px_rgba(224,164,88,0.5)] border border-amber-200/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none will-change-transform"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-canvas-950 border-t-transparent" />
                        <span>Sending reset link...</span>
                      </span>
                    ) : (
                      <>
                        <span>Send Recovery Link</span>
                        <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                      </>
                    )}
                  </motion.button>

                  <div className="text-center pt-2">
                    <Link
                      href="/login"
                      className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Sign In</span>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Privacy & Security Trust Badge */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider select-none">
            <Shield className="h-3 w-3 text-desk-amber" />
            <span>256-Bit Encrypted • Supabase Auth • Privacy First</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
