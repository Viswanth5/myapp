"use client";

import React, { useState } from "react";
import { Mic, ArrowRight, Sparkles, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { GlassCard } from "@/components/ui/GlassCard";

interface DashboardWelcomeProps {
  userName?: string;
  totalPending?: number;
  completedToday?: number;
  focusTaskTitle?: string | null;
}

export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({
  userName = "",
  totalPending = 0,
  completedToday = 0,
  focusTaskTitle = null,
}) => {
  const { setDumpOpen, setDumpInput, setIsRecording } = useOrbitStore();
  const [localInput, setLocalInput] = useState("");

  // Determine contextual time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format current date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Short contextual message based on real data
  const getContextMessage = () => {
    if (focusTaskTitle) {
      return `You have ${totalPending} ${totalPending === 1 ? "task" : "tasks"} scheduled today, with "${focusTaskTitle}" as your main focus.`;
    }
    if (totalPending > 0) {
      return `You have ${totalPending} ${totalPending === 1 ? "task" : "tasks"} on your desk. Select your #1 focus to get started.`;
    }
    if (completedToday > 0) {
      return `Awesome work! You've completed ${completedToday} ${completedToday === 1 ? "task" : "tasks"} today. Your desk is clear.`;
    }
    return "Your day is wide open. What would you like to accomplish today?";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    setDumpInput(localInput);
    setDumpOpen(true);
    setLocalInput("");
  };

  const handleVoice = () => {
    setIsRecording(true);
    setDumpOpen(true);
  };

  const cleanName = typeof userName === "string" ? userName.trim() : "";

  return (
    <GlassCard level={2} className="p-6 sm:p-7 relative overflow-hidden border-white/[0.12]">
      {/* Subtle ambient accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-desk-amber/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-desk-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-mono text-desk-amber uppercase">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mt-1">
              {cleanName ? (
                <>
                  {getGreeting()}, <span className="text-desk-amber">{cleanName}</span>
                </>
              ) : (
                <>
                  {getGreeting()},{" "}
                  <span className="text-desk-amber">welcome</span>
                </>
              )}
            </h1>
          </div>

          {/* Contextual Stats Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1.5 text-xs font-mono">
            <span className="flex h-2 w-2 rounded-full bg-desk-teal animate-pulse" />
            <span className="text-slate-300">
              {totalPending} pending • {completedToday} completed
            </span>
          </div>
        </div>

        {/* Short Contextual Message */}
        <p className="text-sm sm:text-base text-slate-300 font-sans max-w-2xl leading-relaxed">
          {getContextMessage()}
        </p>

        {/* Prominent Quick Capture Input */}
        <form onSubmit={handleSubmit} className="pt-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="What would you like to accomplish today? (e.g. 'Finish report tomorrow, spent ₹250 on petrol, gym 5pm')..."
              className="w-full rounded-2xl bg-white/[0.06] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-3.5 pr-24 text-sm text-white placeholder-slate-400 border border-white/[0.14] focus:border-desk-amber/60 focus:outline-none focus:ring-2 focus:ring-desk-amber/20 backdrop-blur-xl transition-all shadow-inner font-sans"
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVoice}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Voice capture"
              >
                <Mic className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="submit"
                disabled={!localInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-desk-amber hover:bg-desk-amber-glow disabled:opacity-30 disabled:pointer-events-none text-canvas-950 font-bold transition-all cursor-pointer shadow-amber-subtle"
                title="Capture item"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </GlassCard>
  );
};
