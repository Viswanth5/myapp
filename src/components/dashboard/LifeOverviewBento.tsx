"use client";

import React, { useState } from "react";
import {
  IndianRupee,
  Target,
  Flame,
  Dumbbell,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useOrbitStore } from "@/store/useOrbitStore";
import confetti from "canvas-confetti";

interface LifeOverviewBentoProps {
  user: any;
  moneyData?: any;
  habitsData?: any;
  goalsData?: any[];
  allTasks?: any[];
  onRefresh: () => void;
}

export const LifeOverviewBento: React.FC<LifeOverviewBentoProps> = ({
  user,
  moneyData,
  habitsData,
  goalsData = [],
  allTasks = [],
  onRefresh,
}) => {
  const { setActiveTab } = useOrbitStore();
  const [loggingWorkout, setLoggingWorkout] = useState(false);

  // Focus areas configuration
  const focusAreas = user?.focusAreas || [];
  const hasFinance =
    focusAreas.some((f: string) => /finance|money|budget|saving/i.test(f)) ||
    (user?.monthlyBudget && user.monthlyBudget > 0) ||
    (user?.startingBalance && user.startingBalance > 0);

  const hasFitness =
    focusAreas.some((f: string) => /fitness|health|gym|workout/i.test(f)) ||
    (user?.workoutTargetDays && user.workoutTargetDays > 0);

  const hasCollegeOrCareer =
    focusAreas.some((f: string) => /college|academic|career|project|work/i.test(f)) ||
    allTasks.some((t: any) => /assignment|exam|lab|project|report/i.test(t.title || ""));

  // Finance metrics
  const analysis = moneyData?.analysis;
  const balance = analysis?.totalBalance ?? (user?.startingBalance || 0);
  const remainingBudget = analysis?.remainingBudget ?? null;
  const monthlyIncome = user?.monthlyIncome || 0;
  const spentThisMonth = analysis?.totalSpentThisMonth ?? 0;

  // Habits metrics
  const habitsList = habitsData?.habits || [];
  const completedHabitsToday = habitsList.filter((h: any) =>
    h.dots?.some((d: any) => d.isToday && d.status === "completed")
  ).length;

  // Fitness metrics
  const workoutTarget = user?.workoutTargetDays || 4;
  const completedWorkouts = user?.completedWorkoutsThisWeek || 0;
  const remainingWorkouts = Math.max(0, workoutTarget - completedWorkouts);

  // College & Career tasks
  const collegeTasks = allTasks.filter(
    (t: any) =>
      /assignment|exam|lab|syllabus|course|project|interview|resume|portfolio/i.test(t.title || "") &&
      t.status !== "COMPLETED"
  );

  // Log workout handler
  const handleLogWorkout = async () => {
    setLoggingWorkout(true);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#1F6F6B", "#38BDF8", "#FFFFFF"],
    });

    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedWorkoutsThisWeek: completedWorkouts + 1,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingWorkout(false);
    }
  };

  // Toggle habit directly
  const handleToggleHabit = async (habitId: string, currentCompleted: boolean) => {
    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, completed: !currentCompleted }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-white tracking-tight">
          Life Overview
        </h2>
        <span className="text-xs font-mono text-slate-400 uppercase tracking-mono">
          Integrated Balance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. FINANCE CARD */}
        {hasFinance && (
          <GlassCard
            level={1}
            onClick={() => setActiveTab("money")}
            className="p-5 space-y-3 cursor-pointer hover:border-white/[0.2] transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-medium text-white group-hover:text-desk-amber transition-colors">
                  Finance
                </h3>
              </div>
              <span className="text-xs font-mono text-desk-amber group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase text-slate-400">Available Balance</span>
                <p className="font-mono text-lg font-bold text-white mt-0.5">
                  ₹{Number(balance).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] font-mono uppercase text-slate-400">Spent This Month</span>
                <p className="font-mono text-lg font-bold text-desk-amber mt-0.5">
                  ₹{Number(spentThisMonth).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {(analysis?.monthlyBudget > 0 || monthlyIncome > 0) && (
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
                <span>{analysis?.monthlyBudget > 0 ? "Remaining Budget:" : "Monthly Income:"}</span>
                <span className={`font-semibold ${analysis?.monthlyBudget > 0 && remainingBudget <= 0 ? "text-rose-400" : "text-slate-200"}`}>
                  {analysis?.monthlyBudget > 0
                    ? `₹${Number(remainingBudget).toLocaleString("en-IN")}`
                    : `₹${monthlyIncome.toLocaleString("en-IN")}`}
                </span>
              </div>
            )}
          </GlassCard>
        )}

        {/* 2. ROUTINES & HABITS CARD */}
        {habitsList.length > 0 && (
          <GlassCard level={1} className="p-5 space-y-3 border-white/[0.1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
                  <Flame className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-medium text-white">
                  Routines & Habits
                </h3>
              </div>
              <Badge variant="amber" size="sm">
                {completedHabitsToday}/{habitsList.length} Today
              </Badge>
            </div>

            <div className="space-y-2 pt-1">
              {habitsList.slice(0, 3).map((habit: any) => {
                const isCompletedToday = habit.dots?.some(
                  (d: any) => d.isToday && d.status === "completed"
                );
                return (
                  <div
                    key={habit.habitId}
                    onClick={() => handleToggleHabit(habit.habitId, Boolean(isCompletedToday))}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isCompletedToday ? (
                        <CheckCircle2 className="h-4 w-4 text-desk-teal" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-500" />
                      )}
                      <span
                        className={`text-xs font-sans ${
                          isCompletedToday ? "text-slate-400 line-through" : "text-slate-200"
                        }`}
                      >
                        {habit.habitName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {habit.streakCount}d streak
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* 3. HEALTH & FITNESS CARD */}
        {hasFitness && (
          <GlassCard level={1} className="p-5 space-y-3 border-white/[0.1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-desk-teal/15 text-desk-teal border border-desk-teal/30">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-medium text-white">
                  Health & Fitness
                </h3>
              </div>

              <Badge variant="teal" size="sm">
                {completedWorkouts} of {workoutTarget} / wk
              </Badge>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Weekly Movement</span>
                <span>{remainingWorkouts === 0 ? "Target Met!" : `${remainingWorkouts} remaining`}</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-desk-teal transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((completedWorkouts / workoutTarget) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleLogWorkout}
                disabled={loggingWorkout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-desk-teal/20 hover:bg-desk-teal/30 border border-desk-teal/40 text-xs font-mono text-teal-200 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Log Workout</span>
              </button>
            </div>
          </GlassCard>
        )}

        {/* 4. GOALS CARD */}
        {goalsData.length > 0 ? (
          <GlassCard
            level={1}
            onClick={() => setActiveTab("habits")}
            className="p-5 space-y-3 cursor-pointer hover:border-white/[0.2] transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  <Target className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-medium text-white group-hover:text-sky-300 transition-colors">
                  Current Goals
                </h3>
              </div>
              <span className="text-xs font-mono text-sky-400 group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {goalsData.slice(0, 3).map((goal) => {
                const pct =
                  goal.progressPercentage !== undefined
                    ? goal.progressPercentage
                    : Math.min(
                        100,
                        Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100)
                      );
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-200 font-medium truncate">{goal.title}</span>
                      <span className="font-mono text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ) : (
          <GlassCard
            level={1}
            onClick={() => setActiveTab("habits")}
            className="p-5 space-y-2 cursor-pointer hover:border-white/[0.2] transition-all text-center"
          >
            <Target className="h-6 w-6 text-slate-400 mx-auto" />
            <h3 className="font-serif text-sm font-medium text-white">Goals & Milestones</h3>
            <p className="text-xs text-slate-400">
              Set personal, academic, or financial targets to stay purposeful.
            </p>
            <button
              type="button"
              className="text-xs font-mono text-desk-amber hover:underline pt-1 inline-block"
            >
              + Create a Goal
            </button>
          </GlassCard>
        )}

        {/* 5. COLLEGE & CAREER CARD (if applicable) */}
        {hasCollegeOrCareer && collegeTasks.length > 0 && (
          <GlassCard
            level={1}
            className="p-5 space-y-3 border-white/[0.1] md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-medium text-white">
                  College & Career Focus
                </h3>
              </div>
              <Badge variant="teal" size="sm">
                {collegeTasks.length} Pending Items
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {collegeTasks.slice(0, 4).map((ct: any) => (
                <div
                  key={ct.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <span className="text-xs font-medium text-slate-200 truncate pr-2">
                    {ct.title}
                  </span>
                  {ct.dueAt && (
                    <span className="text-[10px] font-mono text-purple-300 shrink-0">
                      {new Date(ct.dueAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
