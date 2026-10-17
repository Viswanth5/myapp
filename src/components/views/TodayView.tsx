"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Headphones, Moon, MessageSquareQuote, Plus } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";

// Dashboard Components
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
import { ConversationalCheckIn } from "@/components/dashboard/ConversationalCheckIn";
import { TodayFocusCard } from "@/components/dashboard/TodayFocusCard";
import { TodayTasksSection } from "@/components/dashboard/TodayTasksSection";
import { PendingFollowUpCard } from "@/components/dashboard/PendingFollowUpCard";
import { LifeOverviewBento } from "@/components/dashboard/LifeOverviewBento";
import { TaskEditModal, BreakdownModal, UniversalTaskCreateModal } from "@/components/dashboard/TaskModals";

// Existing supporting components
import { DeadlineDominoCard } from "@/components/domino/DeadlineDominoCard";
import { AttentionRadar } from "@/components/radar/AttentionRadar";
import { PressureMeter } from "@/components/pressure/PressureMeter";
import { DashboardCharts } from "@/components/charts/DashboardCharts";

export const TodayView: React.FC = () => {
  const { refreshCounter, setFocusOpen, setShutdownOpen, setImportOpen } = useOrbitStore();

  // Task Creation, Edit & Breakdown Modal states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [breakingTask, setBreakingTask] = useState<any | null>(null);

  // 1. Fetch Today Stack & User Dashboard Info
  const todayQuery = useQuery({
    queryKey: ["today", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/today");
      if (!res.ok) throw new Error("Failed to fetch Today");
      return res.json();
    },
  });

  // 2. Fetch Money
  const moneyQuery = useQuery({
    queryKey: ["money", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/money");
      if (!res.ok) throw new Error("Failed to fetch Money");
      return res.json();
    },
  });

  // 3. Fetch Habits
  const habitsQuery = useQuery({
    queryKey: ["habits", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/habits");
      if (!res.ok) throw new Error("Failed to fetch Habits");
      return res.json();
    },
  });

  // 4. Fetch Goals
  const goalsQuery = useQuery({
    queryKey: ["goals", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) return { goals: [] };
      return res.json();
    },
  });

  // 5. Fetch Radar
  const radarQuery = useQuery({
    queryKey: ["radar", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/radar");
      if (!res.ok) return null;
      return res.json();
    },
  });

  // 6. Fetch Pressure
  const pressureQuery = useQuery({
    queryKey: ["pressure", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/pressure");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const todayData = todayQuery.data;
  const user = todayData?.user;
  const focusTask = todayData?.focusTask;
  const mustDoTasks = todayData?.mustDo || [];
  const backlogTasks = todayData?.backlog || [];
  const completedTasks = todayData?.completedTasks || [];
  const pendingFollowUps = todayData?.pendingFollowUps || [];
  const totalPending = todayData?.totalPending || 0;
  const completedToday = todayData?.completedToday || 0;

  const allPendingTasks = [...mustDoTasks, ...backlogTasks];

  const handleRefreshAll = () => {
    todayQuery.refetch();
    moneyQuery.refetch();
    habitsQuery.refetch();
    goalsQuery.refetch();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28"
    >
      {/* 1. Welcome Section */}
      <DashboardWelcome
        userName={user?.preferredName || user?.name || ""}
        totalPending={totalPending}
        completedToday={completedToday}
        focusTaskTitle={focusTask?.title}
      />

      {/* Quick Action Ribbon */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setIsCreateTaskOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orbit-amber/15 hover:bg-orbit-amber/25 border border-orbit-amber/30 text-xs font-mono text-orbit-amber transition-all cursor-pointer active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>

        <button
          onClick={() => setFocusOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 transition-all cursor-pointer active:scale-95"
        >
          <Headphones className="h-3.5 w-3.5 text-desk-teal" />
          <span>Enter Focus Room</span>
        </button>

        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 transition-all cursor-pointer active:scale-95"
        >
          <MessageSquareQuote className="h-3.5 w-3.5 text-desk-amber" />
          <span>Import Notice / Message</span>
        </button>

        <button
          onClick={() => setShutdownOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 transition-all cursor-pointer active:scale-95"
        >
          <Moon className="h-3.5 w-3.5 text-purple-300" />
          <span>Evening Shutdown (9 PM)</span>
        </button>
      </div>

      {/* 2. Conversational Daily Check-In (Core Feature) */}
      <ConversationalCheckIn />

      {/* 3. Pending Activity Follow-Up (Gentle, supportive contextual banner) */}
      <PendingFollowUpCard
        followUps={pendingFollowUps}
        onRefresh={handleRefreshAll}
        onBreakdownTask={(task) => setBreakingTask(task)}
      />

      {/* Deadline Domino Cascade Warning (if any cascade risk) */}
      {allPendingTasks.length > 0 && <DeadlineDominoCard tasks={allPendingTasks} />}

      {/* 4. Interactive Charts Section (Real User Analytics) */}
      <DashboardCharts
        user={user}
        transactions={moneyQuery.data?.transactions || []}
        tasks={allPendingTasks}
        completedTasks={completedTasks}
        habits={habitsQuery.data?.habits || []}
        goals={goalsQuery.data?.goals || []}
      />

      {/* 5. Main Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Focus & Today's Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Focus Card */}
          <TodayFocusCard
            focusTask={focusTask}
            availableTasks={allPendingTasks}
            onRefresh={handleRefreshAll}
            onEditTask={(task) => setEditingTask(task)}
            onBreakdownTask={(task) => setBreakingTask(task)}
          />

          {/* Today's Tasks Section */}
          <TodayTasksSection
            tasks={allPendingTasks}
            completedTasks={completedTasks}
            focusTaskId={focusTask?.id}
            onRefresh={handleRefreshAll}
            onEditTask={(task) => setEditingTask(task)}
            onBreakdownTask={(task) => setBreakingTask(task)}
          />
        </div>

        {/* Right Column: Personal Life Overview & Real-Time Context (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Life Overview Bento (Finance, Habits, Fitness, Goals, College & Career) */}
          <LifeOverviewBento
            user={user}
            moneyData={moneyQuery.data}
            habitsData={habitsQuery.data}
            goalsData={goalsQuery.data?.goals || []}
            allTasks={allPendingTasks}
            onRefresh={handleRefreshAll}
          />

          {/* Attention Radar & Pressure (if user has real task metrics) */}
          {radarQuery.data && <AttentionRadar radar={radarQuery.data} />}
          {pressureQuery.data && <PressureMeter pressure={pressureQuery.data} />}
        </div>
      </div>

      {/* Interactive Modals */}
      <UniversalTaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onRefresh={handleRefreshAll}
      />

      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onRefresh={handleRefreshAll}
      />

      <BreakdownModal
        task={breakingTask}
        isOpen={Boolean(breakingTask)}
        onClose={() => setBreakingTask(null)}
        onRefresh={handleRefreshAll}
      />
    </motion.div>
  );
};
