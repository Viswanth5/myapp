"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  Flame,
  Target,
  Calendar,
  Shield,
  Plus,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { HabitsTab } from "@/components/habits/HabitsTab";
import { GoalsTab } from "@/components/habits/GoalsTab";
import { HabitCalendarTab } from "@/components/habits/HabitCalendarTab";
import { GoalModal } from "@/components/habits/GoalModal";
import { HabitModal } from "@/components/habits/HabitModal";

type ActiveSubTab = "habits" | "goals" | "calendar";

export const HabitsView: React.FC = () => {
  const { refreshCounter, triggerRefresh } = useOrbitStore();
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>("habits");

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<any>(null);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<any>(null);

  const habitsQuery = useQuery({
    queryKey: ["habits-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("Failed to load habits");
      return res.json();
    },
  });

  const goalsQuery = useQuery({
    queryKey: ["goals-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to load goals");
      return res.json();
    },
  });

  const handleRefreshAll = () => {
    habitsQuery.refetch();
    goalsQuery.refetch();
    triggerRefresh();
  };

  const habits = habitsQuery.data?.habits || [];
  const goals = goalsQuery.data?.goals || [];

  return (
    <div className="space-y-6 pb-28">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight flex items-center gap-2.5">
            <span>Goals & Habits Engine</span>
            <span className="text-[10px] font-mono text-orbit-amber uppercase tracking-wider px-2 py-0.5 rounded-full bg-orbit-amber/10 border border-orbit-amber/25">
              Unified
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-mono pt-0.5">
            Quantified milestones connected with atomic habits and 2 monthly grace days
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Target className="h-4 w-4 text-orbit-cyan" />
            <span>+ Goal</span>
          </GlassButton>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => {
              setHabitToEdit(null);
              setIsHabitModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Flame className="h-4 w-4 text-orbit-amber" />
            <span>+ Habit</span>
          </GlassButton>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        {[
          {
            id: "habits",
            label: "Habits & Routines",
            icon: Flame,
            count: habits.length,
            color: "text-orbit-amber",
          },
          {
            id: "goals",
            label: "Goals & Milestones",
            icon: Target,
            count: goals.length,
            color: "text-orbit-cyan",
          },
          {
            id: "calendar",
            label: "Consistency Heatmap",
            icon: Calendar,
            count: undefined,
            color: "text-emerald-400",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as ActiveSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white/[0.1] text-white font-semibold border border-white/[0.15] shadow-lg"
                  : "bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? tab.color : "text-slate-500"}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] opacity-70 px-1.5 py-0.2 rounded-full bg-white/[0.06]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeSubTab === "habits" && (
        <HabitsTab
          habits={habits}
          onOpenCreateModal={() => {
            setHabitToEdit(null);
            setIsHabitModalOpen(true);
          }}
          onEditHabit={(h) => {
            setHabitToEdit(h);
            setIsHabitModalOpen(true);
          }}
          onRefresh={handleRefreshAll}
        />
      )}

      {activeSubTab === "goals" && (
        <GoalsTab
          goals={goals}
          onOpenCreateModal={() => {
            setGoalToEdit(null);
            setIsGoalModalOpen(true);
          }}
          onEditGoal={(g) => {
            setGoalToEdit(g);
            setIsGoalModalOpen(true);
          }}
          onRefresh={handleRefreshAll}
        />
      )}

      {activeSubTab === "calendar" && (
        <HabitCalendarTab habits={habits} onRefresh={handleRefreshAll} />
      )}

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        onSaved={handleRefreshAll}
        goalToEdit={goalToEdit}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setHabitToEdit(null);
        }}
        onSaved={handleRefreshAll}
        habitToEdit={habitToEdit}
      />
    </div>
  );
};
