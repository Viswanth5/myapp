"use client";

import React, { useState } from "react";
import {
  Clock,
  ArrowRight,
  Scissors,
  Check,
  Star,
  X,
  Play,
  Calendar,
  Trash2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import confetti from "canvas-confetti";

interface PendingFollowUpCardProps {
  followUps: any[];
  onRefresh: () => void;
  onBreakdownTask?: (task: any) => void;
}

export const PendingFollowUpCard: React.FC<PendingFollowUpCardProps> = ({
  followUps = [],
  onRefresh,
  onBreakdownTask,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isActing, setIsActing] = useState(false);

  const activeFollowUps = followUps.filter((f) => !dismissedIds.has(f.id));
  if (activeFollowUps.length === 0) return null;

  const currentTask = activeFollowUps[0];
  const isCarried = (currentTask.carriedCount || 0) > 0;
  const isCollege =
    currentTask.category?.toLowerCase() === "college" ||
    /assignment|lab|exam|course|college/i.test(currentTask.title);

  // Requirement 3 Contextual Headline
  const headline = isCollege
    ? `Your college assignment "${currentTask.title}" is still pending. What would you like to do?`
    : `Your task "${currentTask.title}" (${currentTask.category || "Personal"}) is still pending. What would you like to do?`;

  const handleAction = async (action: string, payload?: any) => {
    setIsActing(true);
    try {
      if (action === "COMPLETE") {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#1F6F6B", "#E0A458", "#FFFFFF"],
        });
      }
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentTask.id, action, ...payload }),
      });
      setIsRescheduling(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActing(false);
    }
  };

  const handleQuickReschedule = (daysOffset: number, hour: number = 10) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(hour, 0, 0, 0);
    handleAction("RESCHEDULE", { dueAt: target.toISOString() });
  };

  const handleConfirmCustomDate = () => {
    if (!rescheduleDate) return;
    handleAction("RESCHEDULE", { dueAt: new Date(rescheduleDate).toISOString() });
  };

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(currentTask.id));
  };

  return (
    <GlassCard
      level={1}
      className="p-4 sm:p-5 border-orbit-amber/30 bg-[#0B101D]/95 relative overflow-hidden space-y-3.5 shadow-glass-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-orbit-amber">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orbit-amber/15 border border-orbit-amber/30">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-orbit-amber font-semibold">
              Pending Task Follow-Up
            </span>
            {activeFollowUps.length > 1 && (
              <span className="text-[10px] font-mono text-slate-400 ml-2">
                (1 of {activeFollowUps.length})
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/[0.08]"
          title="Dismiss follow-up"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-sm font-sans text-slate-200 leading-snug">
        {headline}
      </p>

      {/* 5 Required Actions: Complete, Continue, Reschedule, Breakdown, Cancel/Remove */}
      {!isRescheduling ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* 1. Complete it now */}
          <button
            onClick={() => handleAction("COMPLETE")}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orbit-teal/20 hover:bg-orbit-teal/30 border border-orbit-teal/40 text-xs font-mono text-teal-200 transition-colors cursor-pointer active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Complete it now</span>
          </button>

          {/* 2. Continue working */}
          <button
            onClick={() => handleAction("CONTINUE_WORKING")}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orbit-amber/15 hover:bg-orbit-amber/25 border border-orbit-amber/30 text-xs font-mono text-amber-200 transition-colors cursor-pointer active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-amber-200" />
            <span>Continue working</span>
          </button>

          {/* 3. Reschedule it */}
          <button
            onClick={() => setIsRescheduling(true)}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-slate-200 transition-colors cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-orbit-amber" />
            <span>Reschedule it</span>
          </button>

          {/* 4. Break it into smaller tasks */}
          {onBreakdownTask && (
            <button
              onClick={() => onBreakdownTask(currentTask)}
              disabled={isActing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-slate-200 transition-colors cursor-pointer"
            >
              <Scissors className="h-3.5 w-3.5 text-orbit-teal" />
              <span>Break into smaller tasks</span>
            </button>
          )}

          {/* 5. Cancel or remove */}
          <button
            onClick={() => handleAction("CANCEL")}
            disabled={isActing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancel / Remove</span>
          </button>
        </div>
      ) : (
        /* Interactive Rescheduling View */
        <div className="space-y-2.5 pt-2 border-t border-white/[0.1]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>When would you like to reschedule "{currentTask.title}"?</span>
            <button
              onClick={() => setIsRescheduling(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Back to options
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickReschedule(1)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-mono text-white transition-colors"
            >
              Tomorrow (10 AM)
            </button>
            <button
              onClick={() => {
                const today = new Date().getDay();
                const daysUntilSaturday = (6 - today + 7) % 7 || 7;
                handleQuickReschedule(daysUntilSaturday);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-mono text-white transition-colors"
            >
              This Weekend
            </button>
            <button
              onClick={() => {
                const today = new Date().getDay();
                const daysUntilMonday = (1 - today + 7) % 7 || 7;
                handleQuickReschedule(daysUntilMonday);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-mono text-white transition-colors"
            >
              Next Monday
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="rounded-xl bg-white/[0.06] px-3 py-1.5 text-xs font-mono text-white border border-white/[0.14] focus:border-orbit-amber focus:outline-none"
            />
            <button
              onClick={handleConfirmCustomDate}
              disabled={!rescheduleDate}
              className="px-3.5 py-1.5 rounded-xl bg-orbit-amber text-canvas-950 font-semibold text-xs disabled:opacity-40 transition-colors"
            >
              Confirm Date
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
