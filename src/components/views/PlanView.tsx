"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Repeat,
  AlertTriangle,
  Plus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { GlassButton } from "@/components/ui/GlassButton";
import { useOrbitStore } from "@/store/useOrbitStore";
import { UniversalTaskCreateModal, TaskEditModal } from "@/components/dashboard/TaskModals";
import { getCategoryBadgeColor } from "@/lib/constants/tasks";

type PlannerViewMode = "TODAY" | "WEEK" | "MONTH";

export const PlanView: React.FC = () => {
  const { refreshCounter, triggerRefresh } = useOrbitStore();
  const [viewMode, setViewMode] = useState<PlannerViewMode>("WEEK");

  // Selected date for Month view drill-down
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  // Task creation and edit modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const { data: todayData, refetch } = useQuery({
    queryKey: ["today", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/today");
      if (!res.ok) throw new Error("Failed to fetch today data");
      return res.json();
    },
  });

  const allTasks: any[] = todayData?.allTasks || [
    ...(todayData?.mustDo || []),
    ...(todayData?.backlog || []),
    ...(todayData?.completedTasks || []),
  ];

  const pendingTasks = allTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const recurringTasks = allTasks.filter((t) => t.isRecurring || t.metadata?.isRecurring);

  const handleReschedule = async (id: string, daysOffset: number = 1) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    target.setHours(10, 0, 0, 0);

    await fetch("/api/today", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "RESCHEDULE", dueAt: target.toISOString() }),
    });
    refetch();
    triggerRefresh();
  };

  const handleTimeBlockAssign = async (id: string, hour: number) => {
    const target = new Date();
    target.setHours(hour, 0, 0, 0);

    await fetch("/api/today", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "EDIT", dueAt: target.toISOString() }),
    });
    refetch();
    triggerRefresh();
  };

  // Generate 7-day timeline dates
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Calculate upcoming deadlines (next 7 to 30 days)
  const now = new Date();
  const next30DaysEnd = new Date(now.getTime() + 30 * 24 * 3600000);
  const upcomingDeadlines = pendingTasks
    .filter((t) => {
      if (!t.dueAt) return false;
      const dueDate = new Date(t.dueAt);
      return dueDate > now && dueDate <= next30DaysEnd;
    })
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  // Hours for Today Time Blocking (8:00 AM to 10:00 PM)
  const timeBlockHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  // Month Calendar Helper
  const currentMonthStart = new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth(), 1);
  const currentMonthEnd = new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth() + 1, 0);
  const startDayOfWeek = (currentMonthStart.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = currentMonthEnd.getDate();

  return (
    <div className="space-y-6 pb-28">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Schedule & Planner
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Synchronized directly with your Today dashboard and deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
            <button
              onClick={() => setViewMode("TODAY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                viewMode === "TODAY"
                  ? "bg-orbit-amber text-canvas-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode("WEEK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                viewMode === "WEEK"
                  ? "bg-orbit-amber text-canvas-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("MONTH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                viewMode === "MONTH"
                  ? "bg-orbit-amber text-canvas-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Month
            </button>
          </div>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 text-xs whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </GlassButton>
        </div>
      </div>

      {/* 1. TODAY TIME BLOCKING VIEW */}
      {viewMode === "TODAY" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Hourly Schedule (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard level={2} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.1] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orbit-teal" />
                  <span className="font-serif text-base font-semibold text-white">
                    Today's Time Blocks
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Time Slots */}
              <div className="space-y-2">
                {timeBlockHours.map((hour) => {
                  const hourLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;

                  // Find tasks scheduled near this hour today
                  const matchingTasks = pendingTasks.filter((t) => {
                    if (!t.dueAt) return false;
                    const d = new Date(t.dueAt);
                    const isToday = d.toDateString() === new Date().toDateString();
                    return isToday && d.getHours() === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-colors"
                    >
                      <span className="w-20 shrink-0 text-xs font-mono text-slate-400 pt-1">
                        {hourLabel}
                      </span>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {matchingTasks.length === 0 ? (
                          <div className="flex items-center justify-between text-xs text-slate-600 font-mono py-1">
                            <span>Open buffer block</span>
                          </div>
                        ) : (
                          matchingTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => setEditingTask(task)}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-orbit-teal/30 cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-white truncate">
                                  {task.title}
                                </span>
                                {task.category && (
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(task.category)}`}>
                                    {task.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 shrink-0">
                                {task.effortMin && <span>{task.effortMin}m</span>}
                                <Edit2 className="h-3 w-3 text-slate-400 hover:text-white" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Right: Unscheduled / Flexible Tasks (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard level={1} className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-orbit-amber">
                <Layers className="h-4 w-4" />
                <span className="font-serif text-sm font-semibold">Flexible / Unblocked</span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Tasks without fixed hours. Click a slot button to block time:
              </p>

              <div className="space-y-2">
                {pendingTasks
                  .filter((t) => !t.dueAt || new Date(t.dueAt).toDateString() !== new Date().toDateString())
                  .slice(0, 6)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white truncate">{task.title}</span>
                        {task.effortMin && (
                          <span className="text-[10px] font-mono text-slate-400">{task.effortMin}m</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                        <span>Block:</span>
                        <button
                          onClick={() => handleTimeBlockAssign(task.id, 10)}
                          className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-orbit-teal"
                        >
                          10 AM
                        </button>
                        <button
                          onClick={() => handleTimeBlockAssign(task.id, 14)}
                          className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-orbit-amber"
                        >
                          2 PM
                        </button>
                        <button
                          onClick={() => handleTimeBlockAssign(task.id, 18)}
                          className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-purple-300"
                        >
                          6 PM
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW (7-DAY TIMELINE COLUMNS) */}
      {viewMode === "WEEK" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {next7Days.map((dayDate, idx) => {
            const dayName =
              idx === 0
                ? "Today"
                : idx === 1
                ? "Tomorrow"
                : dayDate.toLocaleDateString("en-US", { weekday: "short" });
            const dateLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            // Filter tasks matching this day's date
            const dayTasks = pendingTasks.filter((t) => {
              if (idx === 0 && !t.dueAt) return true; // Unschedules default to today
              if (!t.dueAt) return false;
              const d = new Date(t.dueAt);
              return (
                d.getDate() === dayDate.getDate() &&
                d.getMonth() === dayDate.getMonth() &&
                d.getFullYear() === dayDate.getFullYear()
              );
            });

            const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.effortMin || 30), 0);
            const totalHours = (totalMinutes / 60).toFixed(1);

            return (
              <GlassCard
                key={dayDate.toISOString()}
                level={idx === 0 ? 2 : 1}
                className={`p-4 space-y-3 ${idx === 0 ? "border-orbit-amber/35 bg-[#0B101D]/90" : ""}`}
              >
                {/* Column Day Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-semibold text-white">{dayName}</span>
                    <span className="text-xs font-mono text-slate-400">{dateLabel}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {totalMinutes > 0 ? `${totalHours}h` : "Free"}
                  </span>
                </div>

                {/* Tasks inside this day */}
                <div className="space-y-2 min-h-[140px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-8 text-center">No scheduled work</p>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group flex flex-col gap-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] p-3 border border-white/[0.08] hover:border-white/[0.18] transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            onClick={() => setEditingTask(task)}
                            className="text-xs font-semibold text-white line-clamp-2 cursor-pointer hover:text-orbit-amber transition-colors"
                          >
                            {task.title}
                          </span>
                          {task.effortMin && (
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {task.effortMin}m
                            </span>
                          )}
                        </div>

                        {task.category && (
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(task.category)}`}>
                              {task.category}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.04]">
                          <span>
                            {task.dueAt
                              ? new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "Flexible"}
                          </span>
                          <button
                            onClick={() => handleReschedule(task.id, 1)}
                            className="text-orbit-amber hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
                            title="Reschedule +1 day"
                          >
                            <span>+1d</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* 3. MONTH CALENDAR VIEW */}
      {viewMode === "MONTH" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <GlassCard level={2} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.1] pb-3">
                <span className="font-serif text-lg font-semibold text-white">
                  {selectedCalendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedCalendarDate);
                      prev.setMonth(prev.getMonth() - 1);
                      setSelectedCalendarDate(prev);
                    }}
                    className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const next = new Date(selectedCalendarDate);
                      next.setMonth(next.getMonth() + 1);
                      setSelectedCalendarDate(next);
                    }}
                    className="p-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mon-Sun Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono text-slate-400 pb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty prefix cells */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[70px] rounded-xl bg-white/[0.01]" />
                ))}

                {/* Day Cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const date = new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth(), dayNum);
                  const isToday = date.toDateString() === new Date().toDateString();

                  // Find tasks on this date
                  const tasksOnDate = pendingTasks.filter((t) => {
                    if (!t.dueAt) return false;
                    const d = new Date(t.dueAt);
                    return d.toDateString() === date.toDateString();
                  });

                  return (
                    <div
                      key={dayNum}
                      className={`min-h-[70px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isToday
                          ? "bg-orbit-amber/10 border-orbit-amber/40"
                          : tasksOnDate.length > 0
                          ? "bg-white/[0.04] border-white/[0.12] hover:border-white/[0.25]"
                          : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono ${isToday ? "text-orbit-amber font-bold" : "text-slate-400"}`}>
                          {dayNum}
                        </span>
                        {tasksOnDate.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-orbit-teal" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {tasksOnDate.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(t);
                            }}
                            className="truncate text-[10px] font-sans px-1 rounded bg-white/[0.06] text-white hover:text-orbit-amber"
                          >
                            {t.title}
                          </div>
                        ))}
                        {tasksOnDate.length > 2 && (
                          <span className="text-[9px] font-mono text-slate-500">
                            +{tasksOnDate.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Right: Month Summary */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard level={1} className="p-4 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                Monthly Workload
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 py-1 border-b border-white/[0.06]">
                  <span>Total Scheduled Tasks:</span>
                  <span className="text-white font-bold">{pendingTasks.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 py-1 border-b border-white/[0.06]">
                  <span>Recurring Commitments:</span>
                  <span className="text-orbit-teal font-bold">{recurringTasks.length}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* 4. UPCOMING DEADLINES WIDGET (Next 7 to 30 Days) */}
      <GlassCard level={1} className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.1] pb-3">
          <div className="flex items-center gap-2 text-orbit-amber">
            <CalendarDays className="h-4 w-4" />
            <h3 className="font-serif text-base font-semibold text-white">
              Upcoming Deadlines (Next 7–30 Days)
            </h3>
          </div>
          <Badge variant="amber" size="sm">
            {upcomingDeadlines.length} Upcoming
          </Badge>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">
            No upcoming deadlines beyond this week. Great job staying ahead!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingDeadlines.map((task) => {
              const diffMs = new Date(task.dueAt).getTime() - Date.now();
              const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className="flex flex-col justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.18] transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white line-clamp-1">{task.title}</span>
                    <span className="text-[10px] font-mono text-orbit-amber shrink-0">
                      {daysLeft === 1 ? "Tomorrow" : `In ${daysLeft}d`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    {task.category && (
                      <span className={`px-1.5 py-0.2 rounded border ${getCategoryBadgeColor(task.category)}`}>
                        {task.category}
                      </span>
                    )}
                    <span>{new Date(task.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* 5. RECURRING TASKS & ROUTINES */}
      {recurringTasks.length > 0 && (
        <GlassCard level={1} className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-orbit-teal border-b border-white/[0.1] pb-3">
            <Repeat className="h-4 w-4" />
            <h3 className="font-serif text-base font-semibold text-white">
              Recurring Schedules & Commitments ({recurringTasks.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recurringTasks.map((rt) => (
              <div
                key={rt.id}
                onClick={() => setEditingTask(rt)}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-medium text-white block">{rt.title}</span>
                  <span className="text-[10px] font-mono text-orbit-teal">
                    Repeats {rt.recurringFrequency || rt.metadata?.recurringFrequency || "Daily"}
                  </span>
                </div>
                {rt.effortMin && (
                  <span className="text-[10px] font-mono text-slate-400">{rt.effortMin}m</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Modals */}
      <UniversalTaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRefresh={() => {
          refetch();
          triggerRefresh();
        }}
      />

      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onRefresh={() => {
          refetch();
          triggerRefresh();
        }}
      />
    </div>
  );
};
