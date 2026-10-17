"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  MoreVertical,
  Scissors,
  ArrowRight,
  Edit2,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import confetti from "canvas-confetti";

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodayFocusCardProps {
  focusTask: any | null;
  availableTasks?: any[];
  onRefresh: () => void;
  onEditTask?: (task: any) => void;
  onBreakdownTask?: (task: any) => void;
}

export const TodayFocusCard: React.FC<TodayFocusCardProps> = ({
  focusTask,
  availableTasks = [],
  onRefresh,
  onEditTask,
  onBreakdownTask,
}) => {
  const [isPickingFocus, setIsPickingFocus] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Complete focus task
  const handleComplete = async () => {
    if (!focusTask) return;
    setIsCompleting(true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.65 },
      colors: ["#E0A458", "#1F6F6B", "#FFFFFF"],
    });

    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: focusTask.id, action: "COMPLETE" }),
      });
      setTimeout(() => {
        setIsCompleting(false);
        onRefresh();
      }, 400);
    } catch (err) {
      console.error(err);
      setIsCompleting(false);
    }
  };

  // Set focus on an available task
  const handleSelectFocus = async (taskId: string) => {
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, action: "SET_FOCUS" }),
      });
      setIsPickingFocus(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Unset current focus
  const handleUnsetFocus = async () => {
    if (!focusTask) return;
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: focusTask.id, action: "UNSET_FOCUS" }),
      });
      setActionMenuOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle subtask
  const handleToggleSubtask = async (subtaskId: string) => {
    if (!focusTask) return;
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: focusTask.id,
          action: "TOGGLE_SUBTASK",
          subtaskId,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Add subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !focusTask) return;

    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: focusTask.id,
          action: "ADD_SUBTASK",
          title: newSubtaskTitle.trim(),
        }),
      });
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Reschedule
  const handleReschedule = async (type: "snooze" | "tomorrow") => {
    if (!focusTask) return;
    try {
      if (type === "snooze") {
        await fetch("/api/today", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: focusTask.id, action: "SNOOZE", hours: 4 }),
        });
      } else {
        await fetch("/api/today", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: focusTask.id, action: "RESCHEDULE" }),
        });
      }
      setActionMenuOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // If NO focus configured, display "Set today's focus" state (Requirement 4)
  if (!focusTask) {
    return (
      <GlassCard
        level={2}
        className="p-6 border-dashed border-desk-amber/30 text-center space-y-4 hover:border-desk-amber/50 transition-all"
      >
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-desk-amber/10 text-desk-amber border border-desk-amber/25">
            <Star className="h-6 w-6 fill-desk-amber/30 text-desk-amber" />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-serif text-lg sm:text-xl font-semibold text-white">
            Set Today's Focus
          </h3>
          <p className="text-xs text-slate-300 font-sans">
            Choose the single most important task to achieve today. Everything else becomes secondary.
          </p>
        </div>

        {isPickingFocus ? (
          <div className="max-w-md mx-auto pt-2 space-y-2 text-left">
            <span className="text-[11px] font-mono uppercase tracking-mono text-slate-400">
              Select from pending tasks:
            </span>
            {availableTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No pending tasks. Add a task using the Quick Capture above.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectFocus(t.id)}
                    className="flex w-full items-center justify-between p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-slate-200 transition-colors"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[10px] font-mono text-desk-amber shrink-0 ml-2">
                      Make Focus →
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setIsPickingFocus(false)}
              className="text-xs font-mono text-slate-400 hover:text-white pt-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <GlassButton
              variant="accent"
              size="md"
              onClick={() => setIsPickingFocus(true)}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              <span>Choose Today's Focus</span>
            </GlassButton>
          </div>
        )}
      </GlassCard>
    );
  }

  // Format Due Date
  const formattedDue = focusTask.dueAt
    ? new Date(focusTask.dueAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : null;

  // Subtasks
  const subtasks: Subtask[] = focusTask.metadata?.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <GlassCard
      level={2}
      className={`relative p-6 sm:p-7 border-desk-amber/40 shadow-glass-2 transition-all duration-300 ${
        isCompleting ? "opacity-40 scale-[0.99]" : ""
      }`}
    >
      {/* Ambient warm glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-desk-amber/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header Badge & Action Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="md" className="gap-1.5 px-3 py-1">
              <Star className="h-3.5 w-3.5 fill-desk-amber text-canvas-950" />
              <span>Today's Focus</span>
            </Badge>

            {focusTask.metadata?.priority && (
              <Badge variant={focusTask.metadata.priority === "HIGH" ? "critical" : "teal"} size="sm">
                {focusTask.metadata.priority}
              </Badge>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="rounded-item p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {actionMenuOpen && (
              <div className="absolute right-0 top-8 z-30 w-48 rounded-card bg-[#070B14]/95 backdrop-blur-2xl border border-white/[0.18] p-1.5 shadow-glass-3 space-y-1 text-xs">
                {onEditTask && (
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      onEditTask(focusTask);
                    }}
                    className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Task</span>
                  </button>
                )}

                {onBreakdownTask && (
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      onBreakdownTask(focusTask);
                    }}
                    className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                  >
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Break into Steps</span>
                  </button>
                )}

                <button
                  onClick={() => handleReschedule("snooze")}
                  className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Snooze (+4 hrs)</span>
                </button>

                <button
                  onClick={() => handleReschedule("tomorrow")}
                  className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>Roll to Tomorrow</span>
                </button>

                <button
                  onClick={handleUnsetFocus}
                  className="flex w-full items-center gap-2 rounded-item px-2.5 py-1.5 text-slate-400 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>Unset as Focus</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task Title & Metas */}
        <div className="space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug">
            {focusTask.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
            {formattedDue && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-desk-amber" />
                <span>{formattedDue}</span>
              </div>
            )}

            {focusTask.effortMin && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="h-3.5 w-3.5 text-desk-amber" />
                <span>{focusTask.effortMin} mins estimated</span>
              </div>
            )}

            {focusTask.category && (
              <span className="text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.08]">
                {focusTask.category}
              </span>
            )}
          </div>
        </div>

        {/* Subtasks Section if present or added */}
        {totalSubtasks > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">
                Steps ({completedSubtasks}/{totalSubtasks})
              </span>
              <span className="text-desk-amber">{subtaskProgress}% done</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-desk-teal transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>

            {/* Subtask checklist */}
            <div className="space-y-1.5 pt-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer"
                >
                  <button
                    type="button"
                    className="shrink-0 text-slate-400 hover:text-desk-teal"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-desk-teal" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  <span
                    className={`text-xs font-sans ${
                      st.completed ? "line-through text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Step Inline Form */}
        {isAddingSubtask ? (
          <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Step description (e.g. Outline intro, write section 1)..."
              autoFocus
              className="flex-1 rounded-xl bg-white/[0.05] px-3.5 py-1.5 text-xs text-white placeholder-slate-400 border border-white/[0.12] focus:border-desk-amber focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-3 py-1.5 rounded-xl bg-desk-amber text-canvas-950 font-bold text-xs disabled:opacity-30"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSubtask(false)}
              className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </form>
        ) : null}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            {!isAddingSubtask && (
              <button
                type="button"
                onClick={() => setIsAddingSubtask(true)}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-desk-amber transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step</span>
              </button>
            )}

            {onBreakdownTask && totalSubtasks === 0 && (
              <button
                type="button"
                onClick={() => onBreakdownTask(focusTask)}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-desk-teal transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span>Break into Steps</span>
              </button>
            )}
          </div>

          <GlassButton
            variant="primary"
            size="md"
            onClick={handleComplete}
            disabled={isCompleting}
            className="gap-2 px-5"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            <span>Mark Complete</span>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
};
