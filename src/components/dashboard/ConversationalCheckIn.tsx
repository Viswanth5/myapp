"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  X,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Dumbbell,
  IndianRupee,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  AlertCircle,
  Flame,
  Target,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { useOrbitStore } from "@/store/useOrbitStore";
import {
  STANDARD_TASK_CATEGORIES,
  TASK_PRIORITIES,
  TaskPriority,
  getCategoryBadgeColor,
} from "@/lib/constants/tasks";
import confetti from "canvas-confetti";

interface CheckInTaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  dueAt?: string | null;
  effortMin?: number;
  isFocus: boolean;
}

export const ConversationalCheckIn: React.FC = () => {
  const queryClient = useQueryClient();
  const { refreshCounter, triggerRefresh } = useOrbitStore();

  const [naturalInput, setNaturalInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Personal");
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>("MEDIUM");
  const [tasksList, setTasksList] = useState<CheckInTaskItem[]>([]);
  const [selectedFocusId, setSelectedFocusId] = useState<string | null>(null);

  // College work follow-up input
  const [collegeTaskInput, setCollegeTaskInput] = useState("");
  const [dismissedCollegePrompt, setDismissedCollegePrompt] = useState(false);

  // Active follow-up question target for added tasks (e.g., when time or priority is missing)
  const [activeTaskTargetId, setActiveTaskTargetId] = useState<string | null>(null);

  // Carried task decisions: { [id: string]: 'keep' | 'reschedule' | 'drop' }
  const [carriedDecisions, setCarriedDecisions] = useState<Record<string, "keep" | "reschedule" | "drop">>({});

  // Expense response
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");

  // Workout toggle
  const [workoutChoice, setWorkoutChoice] = useState<boolean | null>(null);

  // Conversational Habits & Goals
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean>>({});
  const [monthlyGoalTitle, setMonthlyGoalTitle] = useState("");
  const [monthlyGoalCategory, setMonthlyGoalCategory] = useState("Personal");
  const [monthlyGoalStepInput, setMonthlyGoalStepInput] = useState("");
  const [monthlyGoalSteps, setMonthlyGoalSteps] = useState<string[]>([]);

  // Expanded/collapsed state for returning users
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);

  // Fetch check-in status and contextual questions
  const checkInQuery = useQuery({
    queryKey: ["checkin", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/checkin");
      if (!res.ok) throw new Error("Failed to fetch check-in");
      return res.json();
    },
  });

  const checkInData = checkInQuery.data;
  const isCompletedToday = checkInData?.isCompletedToday;
  const carriedTasks = checkInData?.carriedTasks || [];
  const existingPending = checkInData?.existingPending || [];

  // Parse natural multi-task entry (split by comma or newline if user types multiple items)
  const handleAddNaturalTasks = (rawText?: string, explicitCategory?: string) => {
    const text = (rawText !== undefined ? rawText : naturalInput).trim();
    if (!text) return;

    // Detect if multi-task (separated by commas or newlines)
    const rawItems = text
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newItems: CheckInTaskItem[] = rawItems.map((itemTitle, idx) => {
      // Auto-categorize college keywords
      const isCollege = /college|lab|assignment|exam|class|lecture|syllabus|professor/i.test(itemTitle);
      const isWork = /project|client|meeting|presentation|resume|code/i.test(itemTitle);
      const isFinance = /money|bill|tax|rent|fee|bank/i.test(itemTitle);

      const itemCat = explicitCategory
        ? explicitCategory
        : isCollege
        ? "College"
        : isWork
        ? "Career & Projects"
        : isFinance
        ? "Finance"
        : selectedCategory;

      return {
        id: `ci-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        title: itemTitle,
        category: itemCat,
        priority: selectedPriority,
        effortMin: 45,
        dueAt: null,
        isFocus: tasksList.length === 0 && idx === 0 && !selectedFocusId,
      };
    });

    setTasksList((prev) => [...prev, ...newItems]);

    if (!selectedFocusId && newItems.length > 0) {
      setSelectedFocusId(newItems[0].id);
    }

    // Set first newly added item as active target for missing info questions
    if (newItems.length > 0) {
      setActiveTaskTargetId(newItems[0].id);
    }

    if (rawText === undefined) {
      setNaturalInput("");
    }
  };

  const handleAddCollegeTask = () => {
    if (!collegeTaskInput.trim()) return;
    handleAddNaturalTasks(collegeTaskInput.trim(), "College");
    setCollegeTaskInput("");
  };

  const handleRemoveTask = (id: string) => {
    setTasksList((prev) => prev.filter((t) => t.id !== id));
    if (selectedFocusId === id) {
      setSelectedFocusId(null);
    }
    if (activeTaskTargetId === id) {
      setActiveTaskTargetId(null);
    }
  };

  // Update target task's due date / time
  const handleSetTaskDue = (taskId: string, hoursFromNow: number) => {
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + hoursFromNow);
    setTasksList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueAt: targetTime.toISOString() } : t))
    );
  };

  // Update target task's priority
  const handleSetTaskPriority = (taskId: string, priority: TaskPriority) => {
    setTasksList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, priority } : t))
    );
  };

  // Submit check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        tasks: tasksList.map((t) => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          dueAt: t.dueAt || null,
          effortMin: t.effortMin || 45,
          isFocus: t.id === selectedFocusId,
        })),
        focusTaskId: selectedFocusId,
        carriedDecisions: Object.entries(carriedDecisions).map(([id, action]) => ({
          id,
          action,
        })),
        workoutScheduled: workoutChoice === true,
        habitCheckIns: Object.entries(habitChecks).map(([habitId, completed]) => ({
          habitId,
          completed,
        })),
        newGoal: monthlyGoalTitle.trim()
          ? {
              title: monthlyGoalTitle.trim(),
              category: monthlyGoalCategory,
              milestones: monthlyGoalSteps,
            }
          : null,
      };

      if (expenseTitle && expenseAmount && parseFloat(expenseAmount) > 0) {
        payload.expense = {
          title: expenseTitle.trim(),
          amount: parseFloat(expenseAmount),
          category: "Personal",
        };
      }

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit check-in");
      return res.json();
    },
    onSuccess: () => {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#1F6F6B", "#E0A458", "#38BDF8"],
      });
      setIsManuallyOpen(false);
      triggerRefresh();
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["checkin"] });
    },
  });

  if (checkInQuery.isLoading) {
    return null;
  }

  // If already completed today and user hasn't explicitly reopened it, show a sleek reminder card
  if (isCompletedToday && !isManuallyOpen) {
    return (
      <GlassCard level={1} className="py-2.5 px-4 flex items-center justify-between border-white/[0.08]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-orbit-teal" />
          <span className="text-xs font-mono text-slate-300">
            Daily Check-In completed for today
          </span>
        </div>
        <button
          onClick={() => setIsManuallyOpen(true)}
          className="text-xs font-mono text-orbit-amber hover:text-white transition-colors cursor-pointer"
        >
          Review or add more →
        </button>
      </GlassCard>
    );
  }

  const allPotentialFocusTasks = [
    ...tasksList.map((t) => ({ id: t.id, title: t.title })),
    ...existingPending.map((e: any) => ({ id: e.id, title: e.title })),
  ];

  // Are today's pending tasks empty?
  const isTodayEmpty = existingPending.length === 0 && tasksList.length === 0;

  // Active task for follow-up questions
  const activeTask = tasksList.find((t) => t.id === activeTaskTargetId) || tasksList[tasksList.length - 1];

  // College work follow-up check:
  // If user has college area and no college tasks entered yet
  const userHasCollegeFocus = checkInData?.questions?.some((q: any) => q.id === "college");
  const hasCollegeTask = tasksList.some((t) => t.category === "College") || existingPending.some((e: any) => e.category === "College");
  const shouldAskCollege = userHasCollegeFocus && !hasCollegeTask && !dismissedCollegePrompt;

  return (
    <GlassCard level={2} className="p-6 sm:p-7 relative border-orbit-amber/35 shadow-glass-2 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orbit-amber/15 text-orbit-amber border border-orbit-amber/30">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Conversational Daily Check-In
              </h2>
              <Badge variant="amber" size="sm">
                Today's Compass
              </Badge>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Natural planning that keeps you focused on what matters today.
            </p>
          </div>
        </div>

        {isCompletedToday && (
          <button
            onClick={() => setIsManuallyOpen(false)}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Collapse"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-6 pt-1">
        {/* 1. Core Conversational Question */}
        <div className="space-y-3">
          <div>
            <label className="block text-base font-serif font-semibold text-white">
              {isTodayEmpty ? "What do you need to get done today?" : "What else do you need to get done today?"}
            </label>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Enter tasks naturally. Separate multiple items with commas (e.g. "Prepare slides, study OS lab, pay electricity bill").
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNaturalTasks();
                }
              }}
              placeholder="e.g. 'Complete CS301 assignment, send draft to mentor, workout'..."
              className="flex-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-2.5 text-sm text-white placeholder-slate-400 border border-white/[0.12] focus:border-orbit-amber/50 focus:outline-none transition-all font-sans"
            />

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl bg-[#0B101D] px-2.5 py-2.5 text-xs font-mono text-slate-300 border border-white/[0.12] focus:outline-none focus:border-orbit-amber"
              >
                {STANDARD_TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedPriority}
                onChange={(e: any) => setSelectedPriority(e.target.value)}
                className="rounded-xl bg-[#0B101D] px-2.5 py-2.5 text-xs font-mono text-slate-300 border border-white/[0.12] focus:outline-none focus:border-orbit-amber"
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <GlassButton
                variant="accent"
                size="md"
                onClick={() => handleAddNaturalTasks()}
                disabled={!naturalInput.trim()}
                className="gap-1 px-4 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </GlassButton>
            </div>
          </div>

          {/* List of Tasks entered in this check-in session */}
          {tasksList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tasksList.map((task) => {
                const isTarget = activeTask?.id === task.id;
                const isFocus = selectedFocusId === task.id;
                const categoryColor = getCategoryBadgeColor(task.category);

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskTargetId(task.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs border transition-all cursor-pointer ${
                      isFocus
                        ? "bg-orbit-amber/20 border-orbit-amber/60 text-amber-200"
                        : isTarget
                        ? "bg-white/[0.09] border-orbit-teal/50 text-white"
                        : "bg-white/[0.05] border-white/[0.09] text-slate-300"
                    }`}
                  >
                    <span className="font-sans font-medium">{task.title}</span>
                    <span className={`text-[10px] font-mono border rounded px-1.5 py-0.2 ${categoryColor}`}>
                      {task.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      ({task.priority.toLowerCase()})
                    </span>
                    {task.dueAt && (
                      <span className="text-[10px] font-mono text-orbit-teal">
                        due {new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTask(task.id);
                      }}
                      className="text-slate-400 hover:text-rose-300 transition-colors ml-1 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Contextual Follow-Up Question: "When should this task be finished?" & "How important is this task?" */}
        {activeTask && (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-orbit-teal uppercase tracking-wider">
                Refining: "{activeTask.title}"
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Category: {activeTask.category}
              </span>
            </div>

            {/* When should this task be finished? */}
            <div className="space-y-1.5">
              <span className="text-xs font-serif text-slate-200">
                When should this task be finished?
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetTaskDue(activeTask.id, 2)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 transition-colors"
                >
                  In 2 hours
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTaskDue(activeTask.id, 5)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 transition-colors"
                >
                  By afternoon (5h)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTaskDue(activeTask.id, 8)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 transition-colors"
                >
                  Tonight (9 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(12, 0, 0, 0);
                    setTasksList((prev) =>
                      prev.map((t) => (t.id === activeTask.id ? { ...t, dueAt: tomorrow.toISOString() } : t))
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 transition-colors"
                >
                  Tomorrow noon
                </button>
              </div>
            </div>

            {/* How important is this task? */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-serif text-slate-200">
                How important is this task?
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {TASK_PRIORITIES.map((p) => {
                  const isActive = activeTask.priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleSetTaskPriority(activeTask.id, p.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
                        isActive
                          ? `${p.color} font-semibold ring-1 ring-white/20`
                          : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. Follow-Up: "What college work do you need to complete?" (if relevant and not yet addressed) */}
        {shouldAskCollege && (
          <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 border border-sky-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-mono uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" />
                <span>College & Academics</span>
              </div>
              <button
                type="button"
                onClick={() => setDismissedCollegePrompt(true)}
                className="text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
              >
                No college tasks today ✕
              </button>
            </div>

            <label className="block text-xs sm:text-sm font-medium text-slate-200 font-serif">
              What college work do you need to complete?
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={collegeTaskInput}
                onChange={(e) => setCollegeTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCollegeTask();
                  }
                }}
                placeholder="e.g. 'Lab manual submission', 'Review chapter 4'..."
                className="flex-1 rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:border-sky-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCollegeTask}
                disabled={!collegeTaskInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-mono text-sky-200 disabled:opacity-30 transition-colors"
              >
                + Add
              </button>
            </div>
          </div>
        )}

        {/* 4. Carried Over Task Decisions */}
        {carriedTasks.length > 0 && (
          <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-orbit-amber text-xs font-mono uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Pending Rollover Follow-Up</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-sans">
              You have {carriedTasks.length} {carriedTasks.length === 1 ? "task" : "tasks"} carried over from yesterday:
            </p>

            <div className="space-y-2">
              {carriedTasks.map((t: any) => {
                const currentDecision = carriedDecisions[t.id] || "keep";
                return (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                  >
                    <span className="text-xs font-medium text-white">{t.title}</span>
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setCarriedDecisions((prev) => ({ ...prev, [t.id]: "keep" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          currentDecision === "keep"
                            ? "bg-orbit-teal text-white font-medium"
                            : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                        }`}
                      >
                        Keep Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarriedDecisions((prev) => ({ ...prev, [t.id]: "reschedule" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          currentDecision === "reschedule"
                            ? "bg-orbit-amber text-canvas-950 font-bold"
                            : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                        }`}
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarriedDecisions((prev) => ({ ...prev, [t.id]: "drop" }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          currentDecision === "drop"
                            ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                            : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                        }`}
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Main Priority Selection: "What is your main priority today?" */}
        {allPotentialFocusTasks.length > 0 && (
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-white font-serif flex items-center gap-1.5">
              <Star className="h-4 w-4 text-orbit-amber fill-orbit-amber" />
              <span>What is your main priority today?</span>
            </label>
            <p className="text-xs text-slate-400">
              Select one task to elevate as Today's Focus hero on your dashboard:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {allPotentialFocusTasks.map((t) => {
                const isSelected = selectedFocusId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedFocusId(isSelected ? null : t.id)}
                    className={`flex items-center gap-2.5 text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-orbit-amber/15 border-orbit-amber/60 text-white shadow-amber-subtle"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-orbit-amber bg-orbit-amber" : "border-slate-500"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-canvas-950" />}
                    </div>
                    <span className="text-xs font-medium truncate">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Habits Contextual Check-in */}
        {checkInData?.questions?.find((q: any) => q.id === "habits") && (
          <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-orbit-amber text-xs font-mono uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5" />
              <span>Habit Check-In</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Which daily habits would you like to log or complete today?
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {checkInData.questions.find((q: any) => q.id === "habits")?.habitsList?.map((h: any) => {
                const isChecked = habitChecks[h.id] === true;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() =>
                      setHabitChecks((prev) => ({
                        ...prev,
                        [h.id]: !prev[h.id],
                      }))
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isChecked
                        ? "bg-orbit-amber/20 border-orbit-amber/60 text-white shadow-amber-subtle"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center ${
                        isChecked ? "border-orbit-amber bg-orbit-amber text-canvas-950" : "border-slate-500"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <span>{h.name}</span>
                    {h.streakCount > 0 && (
                      <span className="text-[10px] font-mono text-orbit-amber">
                        🔥 {h.streakCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Monthly Goal Setup Contextual Question */}
        {checkInData?.questions?.find((q: any) => q.id === "monthly_goal") && (
          <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-mono uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" />
              <span>Milestone Focus</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              What is one important goal you want to achieve this month? (Optional)
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={monthlyGoalTitle}
                onChange={(e) => setMonthlyGoalTitle(e.target.value)}
                placeholder="e.g. Master React Server Components or Save ₹10,000"
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:border-sky-400 focus:outline-none"
              />
              {monthlyGoalTitle.trim() && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    Break this goal into smaller actionable steps:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={monthlyGoalStepInput}
                      onChange={(e) => setMonthlyGoalStepInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && monthlyGoalStepInput.trim()) {
                          e.preventDefault();
                          setMonthlyGoalSteps([...monthlyGoalSteps, monthlyGoalStepInput.trim()]);
                          setMonthlyGoalStepInput("");
                        }
                      }}
                      placeholder="Add an actionable step and press Enter"
                      className="flex-1 rounded-xl bg-white/[0.05] px-3 py-1.5 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (monthlyGoalStepInput.trim()) {
                          setMonthlyGoalSteps([...monthlyGoalSteps, monthlyGoalStepInput.trim()]);
                          setMonthlyGoalStepInput("");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-mono hover:bg-sky-500/30"
                    >
                      + Step
                    </button>
                  </div>
                  {monthlyGoalSteps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {monthlyGoalSteps.map((step, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs text-slate-300"
                        >
                          <span>{step}</span>
                          <button
                            type="button"
                            onClick={() => setMonthlyGoalSteps(monthlyGoalSteps.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Expenses Contextual Question (if relevant) */}
        {checkInData?.questions?.some((q: any) => q.id === "expenses") && (
          <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-orbit-amber text-xs font-mono uppercase tracking-wider">
              <IndianRupee className="h-3.5 w-3.5" />
              <span>Financial Pulse</span>
            </div>
            <label className="block text-xs sm:text-sm font-medium text-slate-200">
              Do you have any expenses to record today? (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="Expense note (e.g. Petrol, Groceries)"
                className="sm:col-span-2 rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:border-orbit-amber focus:outline-none"
              />
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full rounded-xl bg-white/[0.05] pl-7 pr-3 py-2 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:border-orbit-amber focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. Health & Fitness Contextual Question (if relevant) */}
        {checkInData?.questions?.some((q: any) => q.id === "workout") && (
          <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 text-orbit-teal text-xs font-mono uppercase tracking-wider">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Health & Movement</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Would you like to schedule a workout or exercise today?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWorkoutChoice(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                  workoutChoice === true
                    ? "bg-orbit-teal text-white font-medium"
                    : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                }`}
              >
                Yes, schedule workout
              </button>
              <button
                type="button"
                onClick={() => setWorkoutChoice(false)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors ${
                  workoutChoice === false
                    ? "bg-white/[0.12] text-white"
                    : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]"
                }`}
              >
                Rest day today
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.1]">
        <button
          type="button"
          onClick={() => setIsManuallyOpen(false)}
          className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          Skip for now
        </button>

        <GlassButton
          variant="primary"
          size="md"
          onClick={() => checkInMutation.mutate()}
          isLoading={checkInMutation.isPending}
          className="gap-2 px-6"
        >
          <span>Save & Start Day</span>
          <ArrowRight className="h-4 w-4" />
        </GlassButton>
      </div>
    </GlassCard>
  );
};
