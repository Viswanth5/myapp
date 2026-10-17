"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { DominoCascade, detectDeadlineDomino } from "@/lib/engine/domino";
import { AlertTriangle, ArrowRight, ShieldCheck, ChevronRight, Split } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeadlineDominoCardProps {
  tasks: Array<{ id: string; title: string; dueAt?: Date | string | null; carriedCount?: number; effortMin?: number }>;
}

export const DeadlineDominoCard: React.FC<DeadlineDominoCardProps> = ({ tasks }) => {
  const cascade: DominoCascade = detectDeadlineDomino(tasks);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isProtected, setIsProtected] = useState(false);

  if (!cascade.hasCascade || isDismissed) return null;

  return (
    <GlassCard
      level={2}
      className="p-5 border-l-4 border-l-amber-500/80 bg-amber-500/[0.03] space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-medium">
              Deadline Domino Warning
            </span>
            <h4 className="font-serif text-base font-medium text-white">
              Cascade Risk Detected
            </h4>
          </div>
        </div>

        <Badge variant="amber" size="sm">
          Cascade Threat
        </Badge>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {cascade.summaryMessage}
      </p>

      {/* Domino Chain Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {cascade.chain.map((node, idx) => (
          <div
            key={node.taskId}
            className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
              node.isTrigger
                ? "bg-amber-500/[0.08] border-amber-500/30 text-white"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-amber-300 font-semibold">{node.dayName}</span>
              {node.isTrigger ? (
                <span className="text-amber-400 uppercase tracking-wider">Trigger</span>
              ) : (
                <span>Step {idx + 1}</span>
              )}
            </div>

            <p className="text-xs font-medium text-slate-100 line-clamp-2">
              {node.taskTitle}
            </p>

            <span className="text-[10px] font-mono text-slate-400">
              {node.impactDescription}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
        <button
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Dismiss Alert
        </button>

        <div className="flex items-center gap-2">
          {isProtected ? (
            <span className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
              <ShieldCheck className="h-4 w-4" /> Locked into 4:00 PM slot
            </span>
          ) : (
            <button
              onClick={() => setIsProtected(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Protect Schedule (Lock Slot)
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
};
