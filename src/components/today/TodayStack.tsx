"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Moon,
  ArrowRight,
  Scissors,
  Trash2,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { ScoredEntry } from "@/lib/engine/priority";
import confetti from "canvas-confetti";

interface TodayStackProps {
  mustDo: ScoredEntry[];
  backlog: ScoredEntry[];
  onRefresh: () => void;
}

export const TodayStack: React.FC<TodayStackProps> = ({ mustDo, backlog, onRefresh }) => {
  const [showBacklog, setShowBacklog] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [triageItem, setTriageItem] = useState<ScoredEntry | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // Handle task check off
  const handleCheck = async (task: ScoredEntry) => {
    setCompletingIds((prev) => new Set(prev).add(task.id));

    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 },
      colors: ["#1F6F6B", "#E0A458", "#FFFFFF"],
    });

    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, action: "COMPLETE" }),
      });
      setTimeout(() => {
        onRefresh();
      }, 350);
    } catch (err) {
      console.error(err);
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleAction = async (id: string, action: "SNOOZE" | "ROLLOVER" | "DROP") => {
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      setActiveMenuId(null);
      setTriageItem(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Today Desk Stack
          </h2>
          <Badge variant="teal" size="md">
            {mustDo.length} Focus Items
          </Badge>
        </div>
        <span className="text-xs font-mono tracking-mono text-slate-400 uppercase">
          Ranked Priority
        </span>
      </div>

      {/* Top Must-Do Cards (Level 2 Glass) */}
      <div className="space-y-3">
        {mustDo.length === 0 ? (
          <GlassCard level={1} className="p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-10 w-10 text-desk-teal mb-3 opacity-80" strokeWidth={1.5} />
            <p className="font-serif text-lg text-white">Your study desk is completely clear!</p>
            <p className="text-xs text-slate-400 mt-1">Use the quick capture bar above to add incoming work.</p>
          </GlassCard>
        ) : (
          mustDo.map((task, idx) => {
            const isCompleting = completingIds.has(task.id);
            const isCarried = (task.carriedCount || 0) > 0;
            const isTriage = (task.carriedCount || 0) >= 3;

            return (
              <GlassCard
                key={task.id}
                level={2}
                className={`group relative transition-all duration-300 ${
                  isCompleting ? "opacity-35 scale-[0.98]" : ""
                } ${idx === 0 ? "border-white/[0.22] shadow-glass-2" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox + Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleCheck(task)}
                      className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-desk-teal transition-transform active:scale-90 cursor-pointer"
                      title="Mark complete"
                    >
                      {isCompleting ? (
                        <CheckCircle2 className="h-5 w-5 text-desk-teal animate-bounce" strokeWidth={2} />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400 hover:text-white transition-colors" strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold tracking-tight text-white ${
                            isCompleting ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {task.title}
                        </span>

                        {isCarried && (
                          <Badge
                            variant={isTriage ? "critical" : "amber"}
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => setTriageItem(task)}
                          >
                            Carried {task.carriedCount}x {isTriage ? "• Triage" : ""}
                          </Badge>
                        )}
                      </div>

                      {/* "Why this is here" line */}
                      <p className="text-xs text-slate-400 font-sans flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-desk-amber" />
                        <span>{task.explanation || "Computed priority score"}</span>
                      </p>

                      {/* Auto Time-boxing Suggestion */}
                      {task.suggestedSlot && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1 rounded-item bg-white/[0.06] px-2 py-0.5 text-[11px] font-mono text-slate-300 border border-white/[0.1]">
                            <Clock className="h-3 w-3 text-desk-amber" strokeWidth={1.5} />
                            {task.suggestedSlot.start} – {task.suggestedSlot.end}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                            Suggested slot
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      className="rounded-item p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === task.id && (
                      <div className="absolute right-0 top-8 z-30 w-44 rounded-card bg-[#070B14]/95 backdrop-blur-2xl border border-white/[0.18] p-1.5 shadow-glass-3 space-y-1 text-xs">
                        <button
                          onClick={() => handleAction(task.id, "SNOOZE")}
                          className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                        >
                          <Moon className="h-3.5 w-3.5" />
                          <span>Snooze (+4 hrs)</span>
                        </button>
                        <button
                          onClick={() => handleAction(task.id, "ROLLOVER")}
                          className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>Roll to Tomorrow</span>
                        </button>
                        <button
                          onClick={() => handleAction(task.id, "DROP")}
                          className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Drop without guilt</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Collapsible Backlog */}
      {backlog.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <span>{showBacklog ? "Hide" : "Show"} Backlog ({backlog.length} items)</span>
            {showBacklog ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <AnimatePresence>
            {showBacklog && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {backlog.map((task) => (
                  <GlassCard key={task.id} level={1} className="p-3.5 rounded-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleCheck(task)}
                          className="text-slate-400 hover:text-desk-teal transition-colors"
                        >
                          <Circle className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <div>
                          <p className="text-xs font-medium text-slate-200">{task.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{task.explanation}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        Score {task.priorityScore}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3-Day Carried Triage Modal */}
      {triageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-panel bg-[#0B101D] border border-desk-amber/40 p-6 shadow-glass-3 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-desk-amber">
              <Clock className="h-5 w-5" />
              <h3 className="font-serif text-lg font-semibold text-white">Smart Rollover Triage</h3>
            </div>
            <p className="text-xs text-slate-300">
              "{triageItem.title}" has been carried {triageItem.carriedCount} times. Zero guilt — let's choose how to handle it:
            </p>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <GlassButton
                variant="accent"
                size="md"
                onClick={() => handleAction(triageItem.id, "SNOOZE")}
                className="justify-start gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>Do it today in next focus slot</span>
              </GlassButton>

              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => handleAction(triageItem.id, "DROP")}
                className="justify-start gap-2"
              >
                <Scissors className="h-4 w-4" />
                <span>Split into 20-min micro steps</span>
              </GlassButton>

              <GlassButton
                variant="danger"
                size="md"
                onClick={() => handleAction(triageItem.id, "DROP")}
                className="justify-start gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Drop without guilt (no longer needed)</span>
              </GlassButton>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setTriageItem(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
