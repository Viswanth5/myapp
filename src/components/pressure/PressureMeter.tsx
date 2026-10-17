"use client";

import React from "react";
import { PressureMetric } from "@/lib/engine/pressure";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, ArrowUpRight } from "lucide-react";

interface PressureMeterProps {
  pressure?: PressureMetric | null;
}

export const PressureMeter: React.FC<PressureMeterProps> = ({ pressure }) => {
  if (!pressure) return null;

  const score = pressure.score;
  const strokeDash = `${(score / 100) * 283} 283`;

  const colorConfig = {
    calm: { stroke: "#1F6F6B", text: "text-desk-teal-light", bg: "bg-desk-teal/10" },
    moderate: { stroke: "#E0A458", text: "text-desk-amber-light", bg: "bg-desk-amber/10" },
    heavy: { stroke: "#F97316", text: "text-orange-300", bg: "bg-orange-500/10" },
    critical: { stroke: "#F43F5E", text: "text-rose-300", bg: "bg-rose-500/10" },
  }[pressure.level];

  return (
    <GlassCard level={1} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-item bg-desk-teal/20 text-desk-teal border border-desk-teal/30">
            <Activity className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Pressure Meter</h3>
            <p className="text-[11px] font-mono tracking-mono text-slate-400 uppercase">Workload vs Capacity</p>
          </div>
        </div>

        <span className={`text-xs font-mono font-semibold uppercase ${colorConfig.text}`}>
          {pressure.statusText}
        </span>
      </div>

      {/* Circular Gauge and Stats */}
      <div className="flex items-center gap-5">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="7"
            />
            {/* Value stroke */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={colorConfig.stroke}
              strokeWidth="7"
              strokeDasharray={strokeDash}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {score}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">/ 100</span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="space-y-1.5 text-xs flex-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Work Load:</span>
            <span className="font-mono font-semibold text-white">
              {pressure.totalEffortHours} hrs
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Weekly Free Hours:</span>
            <span className="font-mono text-slate-300">
              {pressure.availableHours} hrs
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Capacity Ratio:</span>
            <span className={`font-mono font-semibold ${colorConfig.text}`}>
              {pressure.workloadRatio}%
            </span>
          </div>
        </div>
      </div>

      {/* Gentle Advisory with Suggested Fix */}
      <div className="rounded-item bg-white/[0.04] p-3 border border-white/[0.08] text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
          <ArrowUpRight className="h-3.5 w-3.5 text-desk-amber" />
          <span>Balancing Suggestion:</span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          {pressure.suggestedFix}
        </p>
      </div>
    </GlassCard>
  );
};
