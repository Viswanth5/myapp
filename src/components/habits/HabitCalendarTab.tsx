"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar as CalendarIcon,
  Flame,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { formatDateKey, HabitHeatStrip } from "@/lib/engine/habits";
import confetti from "canvas-confetti";

interface HabitCalendarTabProps {
  habits: HabitHeatStrip[];
  onRefresh: () => void;
}

export const HabitCalendarTab: React.FC<HabitCalendarTabProps> = ({
  habits,
  onRefresh,
}) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string>("all");
  const [selectedDateModal, setSelectedDateModal] = useState<{
    dateStr: string;
    habitId: string;
    habitName: string;
    isCompleted: boolean;
  } | null>(null);

  // Month navigation: offset 0 = current month
  const [monthOffset, setMonthOffset] = useState<number>(0);

  const displayDate = new Date();
  displayDate.setMonth(displayDate.getMonth() + monthOffset);
  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Compute days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  // Convert to Mon=0, Sun=6
  const startDayIndex = (firstDayOfWeek + 6) % 7;

  const todayStr = formatDateKey(new Date());

  // Quick toggle date completion
  const handleToggleDate = async (
    habitId: string,
    dateStr: string,
    newStatus: boolean
  ) => {
    if (newStatus) {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.6 },
        colors: ["#1F6F6B", "#E0A458"],
      });
    }

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: dateStr,
          completed: newStatus,
        }),
      });
      setSelectedDateModal(null);
      onRefresh();
    } catch (err) {
      console.error("Calendar date toggle error:", err);
    }
  };

  const selectedHabit = habits.find((h) => h.habitId === selectedHabitId);

  // Aggregate completion stats
  const totalHabits = habits.length;
  const avgMonthlyRate =
    totalHabits > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.monthlyCompletionRate, 0) / totalHabits)
      : 0;
  const avgWeeklyRate =
    totalHabits > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.weeklyCompletionRate, 0) / totalHabits)
      : 0;

  return (
    <div className="space-y-5">
      {/* Top Filter & Month Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Habit Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">View Ritual:</label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="rounded-xl bg-[#0f172a] px-3 py-1.5 text-xs text-white border border-white/[0.1] focus:outline-none"
          >
            <option value="all">All Habits Overview</option>
            {habits.map((h) => (
              <option key={h.habitId} value={h.habitId}>
                {h.habitName} ({h.streakCount}d streak)
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-serif text-sm font-medium text-white px-2">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {monthOffset !== 0 && (
            <button
              onClick={() => setMonthOffset(0)}
              className="text-[11px] font-mono text-orbit-cyan hover:underline ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard level={1} className="p-4 space-y-1 border-white/[0.08]">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Weekly Completion Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-white">
              {selectedHabit ? `${selectedHabit.weeklyCompletionRate}%` : `${avgWeeklyRate}%`}
            </span>
            <span className="text-xs font-mono text-emerald-400">Last 7 Days</span>
          </div>
        </GlassCard>

        <GlassCard level={1} className="p-4 space-y-1 border-white/[0.08]">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Monthly Consistency
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-orbit-amber">
              {selectedHabit ? `${selectedHabit.monthlyCompletionRate}%` : `${avgMonthlyRate}%`}
            </span>
            <span className="text-xs font-mono text-slate-400">Last 30 Days</span>
          </div>
        </GlassCard>

        <GlassCard level={1} className="p-4 space-y-1 border-white/[0.08]">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Active Streak Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-orbit-cyan">
              {selectedHabit ? `${selectedHabit.streakCount} Days` : `${habits.filter(h => h.streakCount > 0).length} Habits Active`}
            </span>
            {selectedHabit && (
              <span className="text-xs font-mono text-slate-400">
                (Best: {selectedHabit.bestStreak}d)
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Monthly Calendar Grid */}
      <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12]">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono text-slate-400 pb-2 border-b border-white/[0.06]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before month starts */}
          {Array.from({ length: startDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 rounded-xl bg-white/[0.01]" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateObj = new Date(currentYear, currentMonth, dayNum);
            const dateStr = formatDateKey(dateObj);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            // Find logs for this date
            const relevantHabits = selectedHabit ? [selectedHabit] : habits;

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (selectedHabit && !isFuture) {
                    const dot = selectedHabit.dots.find((d) => d.dateStr === dateStr);
                    const isDone = dot?.status === "completed" || dot?.status === "grace";
                    setSelectedDateModal({
                      dateStr,
                      habitId: selectedHabit.habitId,
                      habitName: selectedHabit.habitName,
                      isCompleted: Boolean(isDone),
                    });
                  }
                }}
                className={`h-16 p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isToday
                    ? "bg-white/[0.08] border-orbit-amber/60 shadow-amber-subtle"
                    : isFuture
                    ? "bg-white/[0.02] border-white/[0.04] opacity-50"
                    : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium ${
                      isToday ? "text-orbit-amber font-bold" : "text-slate-300"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[9px] font-mono text-orbit-amber uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Habit completion indicators for this day */}
                <div className="flex flex-wrap gap-1">
                  {relevantHabits.map((h) => {
                    const dot = h.dots.find((d) => d.dateStr === dateStr);
                    const status = dot?.status || (isFuture ? "future" : "rest");

                    const statusStyles: Record<string, string> = {
                      completed: "bg-orbit-teal border-orbit-teal-glow shadow-teal-subtle",
                      grace: "bg-orbit-amber border-orbit-amber-glow shadow-amber-subtle",
                      missed: "bg-rose-500/40 border-rose-500/60",
                      rest: "bg-white/[0.06] border-white/[0.10]",
                      pending: "bg-amber-500/20 border-amber-500/40 animate-pulse",
                      future: "bg-white/[0.02] border-transparent",
                    };

                    return (
                      <div
                        key={h.habitId}
                        title={`${h.habitName}: ${status}`}
                        className={`h-2.5 w-2.5 rounded-full border ${statusStyles[status] || "bg-white/[0.06]"}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06] text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orbit-teal border border-orbit-teal-glow" />
              <span>Completed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-orbit-amber border border-orbit-amber-glow" />
              <span>Grace Applied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/40 border border-rose-500/60" />
              <span>Missed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-white/[0.06] border border-white/[0.12]" />
              <span>Scheduled Rest</span>
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            Click any past date to log or correct an entry
          </span>
        </div>
      </GlassCard>

      {/* Encouraging Mindset Banner */}
      <GlassCard level={1} className="p-4 flex items-center gap-3 border-white/[0.06]">
        <Info className="h-5 w-5 text-orbit-cyan shrink-0" />
        <p className="text-xs font-mono text-slate-300">
          Consistency is built over time, not broken by an occasional rest day. Your grace days preserve active momentum when life intervenes.
        </p>
      </GlassCard>

      {/* Interactive Date Edit Modal */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md">
          <GlassCard level={2} className="w-full max-w-sm p-5 space-y-4 border-white/[0.12]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h4 className="font-serif text-base font-semibold text-white">
                  Log Entry for {selectedDateModal.dateStr}
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  {selectedDateModal.habitName}
                </p>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Update or correct the completion status for this date:
            </p>

            <div className="flex gap-2">
              <GlassButton
                variant={selectedDateModal.isCompleted ? "secondary" : "accent"}
                size="sm"
                onClick={() =>
                  handleToggleDate(
                    selectedDateModal.habitId,
                    selectedDateModal.dateStr,
                    !selectedDateModal.isCompleted
                  )
                }
                className="flex-1"
              >
                {selectedDateModal.isCompleted ? (
                  <>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    <span>Mark Incomplete</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    <span>Mark Completed</span>
                  </>
                )}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
