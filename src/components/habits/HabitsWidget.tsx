"use client";

import React from "react";
import { HabitHeatStrip } from "@/lib/engine/habits";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Flame, Shield } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { motion } from "framer-motion";

interface HabitsWidgetProps {
  habits?: HabitHeatStrip[];
  onCheckHabit?: (habitId: string) => void;
}

export const HabitsWidget: React.FC<HabitsWidgetProps> = ({ habits }) => {
  const { setActiveTab } = useOrbitStore();
  if (!habits || habits.length === 0) return null;

  return (
    <GlassCard level={1} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-item bg-desk-amber/20 text-desk-amber border border-desk-amber/30">
            <Flame className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Streaks with Grace</h3>
            <p className="text-[11px] font-mono tracking-mono text-slate-400 uppercase">2 Grace Days / Month</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("habits")}
          className="text-xs text-desk-amber hover:text-desk-amber-light font-mono underline-offset-4 hover:underline"
        >
          All Habits →
        </button>
      </div>

      {/* Habit Dot-Matrix Strips */}
      <div className="space-y-3">
        {habits.slice(0, 3).map((habit) => {
          return (
            <div key={habit.habitId} className="space-y-2 rounded-card bg-white/[0.03] p-3 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{habit.habitName}</span>
                  <Badge variant="amber" size="sm">
                    {habit.streakCount}d streak
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Shield className="h-3 w-3 text-desk-amber" strokeWidth={1.5} />
                  <span>{habit.graceDaysLeft} grace left</span>
                </div>
              </div>

              {/* 21-day Dot Matrix */}
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {habit.dots.map((dot, idx) => {
                  const statusColors: Record<string, string> = {
                    completed: "bg-desk-teal border-desk-teal-glow shadow-teal-subtle",
                    grace: "bg-desk-amber border-desk-amber-glow shadow-amber-subtle",
                    missed: "bg-rose-500/40 border-rose-500/60",
                    rest: "bg-white/[0.06] border-white/[0.10]",
                    pending: "bg-amber-500/20 border-amber-500/40 animate-pulse",
                    future: "bg-white/[0.03] border-transparent",
                  };

                  return (
                    <motion.div
                      key={dot.dateStr || idx}
                      whileHover={{ scale: 1.25 }}
                      title={`${dot.dateStr}: ${dot.status}${dot.isToday ? " (Today)" : ""}`}
                      className={`h-3 w-3 rounded-full border transition-all cursor-pointer ${
                        statusColors[dot.status]
                      } ${dot.isToday ? "ring-2 ring-white/60" : ""}`}
                    />
                  );
                })}
              </div>

              <p className="text-[10px] font-mono text-slate-400">
                {habit.statusMessage}
              </p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
