"use client";

import React from "react";
import { RadarData } from "@/lib/engine/radar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface AttentionRadarProps {
  radar?: RadarData | null;
}

export const AttentionRadar: React.FC<AttentionRadarProps> = ({ radar }) => {
  if (!radar) return null;

  return (
    <GlassCard level={1} className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-item bg-desk-plum/30 text-desk-plum-light border border-desk-plum/40">
            <ShieldAlert className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Attention Radar</h3>
            <p className="text-[11px] font-mono tracking-mono text-slate-400 uppercase">7-Day Threat Surface</p>
          </div>
        </div>

        {radar.criticalCount > 0 ? (
          <Badge variant="critical" size="sm">
            {radar.criticalCount} Needs Attention
          </Badge>
        ) : (
          <Badge variant="teal" size="sm">
            Clear Horizon
          </Badge>
        )}
      </div>

      {/* 7-Day Timeline Heatmap Strip */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono tracking-mono text-slate-400 uppercase">
          7-Day Submission Intensity
        </span>
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {radar.dayHeatmap.map((day) => {
            const glowLevel =
              day.threatScore >= 60
                ? "bg-rose-500/25 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)] text-rose-200"
                : day.threatScore >= 30
                ? "bg-desk-amber/20 border-desk-amber/40 text-desk-amber-light"
                : "bg-white/[0.03] border-white/[0.08] text-slate-400";

            return (
              <motion.div
                key={day.dayOffset}
                whileHover={{ scale: 1.06 }}
                className={`flex flex-col items-center justify-center rounded-item p-2 border transition-all ${glowLevel}`}
              >
                <span className="text-[9px] font-mono uppercase">{day.dayLabel.slice(0, 3)}</span>
                <span className="text-xs font-mono font-semibold mt-1">
                  {day.hasExam ? "EXAM" : day.taskCount > 0 ? `${day.taskCount}` : "–"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Surface Threats List */}
      <div className="space-y-2 pt-1">
        {radar.threats.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">
            No deadline clustering or budget drifts detected.
          </p>
        ) : (
          radar.threats.slice(0, 3).map((threat) => {
            const isCrit = threat.severity === "critical";

            return (
              <div
                key={threat.id}
                className={`flex items-start gap-2.5 rounded-item p-3 border text-xs transition-all ${
                  isCrit
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-100"
                    : "bg-desk-amber/10 border-desk-amber/30 text-amber-100"
                }`}
              >
                {isCrit ? (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-desk-amber shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{threat.title}</span>
                    {threat.metric && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.1]">
                        {threat.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 opacity-90">{threat.description}</p>
                  <p className="text-[10px] font-mono text-desk-amber-light pt-0.5">
                    Suggested Fix: {threat.actionPrompt}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
};
