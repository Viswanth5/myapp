"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  Flame,
  Plus,
  Shield,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { HabitHeatStrip } from "@/lib/engine/habits";

interface HabitsTabProps {
  habits: HabitHeatStrip[];
  onOpenCreateModal: () => void;
  onEditHabit: (habit: any) => void;
  onRefresh: () => void;
}

export const HabitsTab: React.FC<HabitsTabProps> = ({
  habits,
  onOpenCreateModal,
  onEditHabit,
  onRefresh,
}) => {
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null);

  const handleToggleToday = async (habitId: string, currentlyCompleted: boolean) => {
    setLoadingHabitId(habitId);

    if (!currentlyCompleted) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#E0A458", "#1F6F6B", "#38BDF8"],
      });
    }

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          completed: !currentlyCompleted,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Habit toggle error:", err);
    } finally {
      setLoadingHabitId(null);
    }
  };

  const handleStatusChange = async (habitId: string, newStatus: string) => {
    try {
      await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: habitId,
          status: newStatus,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Update habit status error:", err);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm("Are you sure you want to delete this habit and its historical logs?")) return;
    try {
      await fetch(`/api/habits?id=${habitId}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error("Delete habit error:", err);
    }
  };

  const completedTodayCount = habits.filter((h) => h.isCompletedToday).length;

  return (
    <div className="space-y-5">
      {/* Summary Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge variant="amber" size="md">
            🔥 {completedTodayCount} of {habits.length} Done Today
          </Badge>
          <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Shield className="h-3.5 w-3.5 text-orbit-amber" />
            <span>Monthly Grace Active</span>
          </span>
        </div>

        <GlassButton
          variant="accent"
          size="sm"
          onClick={onOpenCreateModal}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </GlassButton>
      </div>

      {/* Empty State */}
      {habits.length === 0 ? (
        <GlassCard className="p-10 text-center space-y-3 border-white/[0.08]">
          <div className="h-12 w-12 rounded-2xl bg-orbit-amber/15 border border-orbit-amber/30 text-orbit-amber flex items-center justify-center mx-auto">
            <Flame className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="font-serif text-lg font-medium text-white">
              No habit rituals configured yet
            </h4>
            <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto pt-1">
              Build automatic momentum with daily routines, protected by monthly grace days when life gets busy.
            </p>
          </div>
          <div className="pt-2">
            <GlassButton variant="primary" size="sm" onClick={onOpenCreateModal}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Create Your First Habit</span>
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        /* Habits Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isCompleted = habit.isCompletedToday;
            const isLoading = loadingHabitId === habit.habitId;

            return (
              <GlassCard
                key={habit.habitId}
                variant="hero"
                className={`p-5 space-y-4 border-white/[0.12] transition-all ${
                  isCompleted ? "border-orbit-teal/30 bg-orbit-teal/5" : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-slate-300">
                        {habit.category || "General"}
                      </span>
                      {habit.reminderTime && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <Clock className="h-2.5 w-2.5 text-orbit-amber" />
                          {habit.reminderTime}
                        </span>
                      )}
                    </div>
                    <h4 className="font-serif text-lg font-semibold text-white tracking-tight">
                      {habit.habitName}
                    </h4>
                    {habit.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title="Edit Habit"
                      onClick={() => onEditHabit(habit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Delete Habit"
                      onClick={() => handleDeleteHabit(habit.habitId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Badges: Current Streak, Best Streak, Grace */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="amber" size="sm">
                    🔥 {habit.streakCount}d Streak
                  </Badge>
                  {habit.bestStreak > 0 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      Best: {habit.bestStreak}d
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 ml-auto">
                    <Shield className="h-3 w-3 text-orbit-amber" />
                    <span>{habit.graceDaysLeft} grace left</span>
                  </span>
                </div>

                {/* 21-Day Dot Matrix Heat Strip */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>Recent 21 Days Matrix</span>
                    <span>7d: {habit.weeklyCompletionRate}% • 30d: {habit.monthlyCompletionRate}%</span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {habit.dots.slice(-21).map((dot, idx) => {
                      const statusColors: Record<string, string> = {
                        completed: "bg-orbit-teal border-orbit-teal-glow shadow-teal-subtle",
                        grace: "bg-orbit-amber border-orbit-amber-glow shadow-amber-subtle",
                        missed: "bg-rose-500/30 border-rose-500/50",
                        rest: "bg-white/[0.06] border-white/[0.10]",
                        pending: "bg-amber-500/20 border-amber-500/40 animate-pulse",
                        future: "bg-white/[0.03] border-transparent",
                      };

                      return (
                        <div
                          key={dot.dateStr || idx}
                          title={`${dot.dateStr} (${dot.dayName}): ${dot.status}${dot.isToday ? " • Today" : ""}`}
                          className={`h-4 w-4 rounded-full border transition-all ${
                            statusColors[dot.status] || "bg-white/[0.06] border-white/[0.10]"
                          } ${dot.isToday ? "ring-2 ring-white/80" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Footer Check-in Action & Feedback */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                  <span className="text-xs font-mono text-orbit-amber-light">
                    {habit.statusMessage}
                  </span>

                  <GlassButton
                    variant={isCompleted ? "secondary" : "accent"}
                    size="sm"
                    onClick={() => handleToggleToday(habit.habitId, isCompleted)}
                    isLoading={isLoading}
                    className="gap-1.5"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Check In</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
