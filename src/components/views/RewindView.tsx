"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { History, Sparkles, CheckCircle2, TrendingDown, ArrowUpRight, Flame } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";

export const RewindView: React.FC = () => {
  const { refreshCounter } = useOrbitStore();

  const { data } = useQuery({
    queryKey: ["rewind-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/rewind");
      return res.json();
    },
  });

  const rewind = data?.rewind;
  if (!rewind) return null;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Weekly Rewind & Reflection
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            A calm, human reflection on what got done and where to focus next
          </p>
        </div>
        <Badge variant="teal" size="md">
          Sunday Synthesis
        </Badge>
      </div>

      {/* Hero Summary Card */}
      <GlassCard variant="hero" className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orbit-teal/20 text-orbit-teal border border-orbit-teal/30">
            <Sparkles className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-medium text-white">This Week's Horizon</h3>
            <p className="text-xs text-slate-400 font-mono">
              {rewind.userName ? `Synthesized for ${rewind.userName}` : "Synthesized for you"}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed border-l-2 border-orbit-teal pl-4 py-1 italic">
          "{rewind.summaryText || rewind.humanSummary}"
        </p>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Tasks Wrapped</span>
            <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
              {rewind.completedTasks}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Carried Over</span>
            <p className="font-mono text-xl font-bold text-orbit-amber tabular-nums mt-0.5">
              {rewind.carriedTasks}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Money Out</span>
            <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
              ₹{rewind.totalSpent}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] p-3 border border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Habits Score</span>
            <p className="font-mono text-xl font-bold text-orbit-teal-light tabular-nums mt-0.5">
              {rewind.habitsScore || rewind.habitsHeldScore}%
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 3 Suggested Focus Areas for Next Week */}
      <GlassCard variant="default" className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-orbit-amber" />
          <h3 className="font-serif text-lg font-medium text-white">
            3 Suggested Focus Items for Next Week
          </h3>
        </div>

        <div className="space-y-3">
          {(rewind.focusSuggestions || []).map((sug: string, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3.5 border border-white/[0.08] text-sm text-slate-200"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orbit-amber/20 font-mono text-xs font-bold text-orbit-amber">
                {idx + 1}
              </span>
              <p className="font-sans leading-relaxed">{sug}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
