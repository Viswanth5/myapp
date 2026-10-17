"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  MoreVertical,
  Star,
  Scissors,
  ArrowRight,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
  XCircle,
  Repeat,
  Tag,
  ListTodo,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { UniversalTaskCreateModal } from "@/components/dashboard/TaskModals";
import {
  STANDARD_TASK_CATEGORIES,
  TASK_PRIORITIES,
  getCategoryBadgeColor,
} from "@/lib/constants/tasks";
import confetti from "canvas-confetti";

interface TodayTasksSectionProps {
  tasks: any[];
  completedTasks: any[];
  focusTaskId?: string | null;
  onRefresh: () => void;
  onEditTask?: (task: any) => void;
  onBreakdownTask?: (task: any) => void;
}

export const TodayTasksSection: React.FC<TodayTasksSectionProps> = ({
  tasks = [],
  completedTasks = [],
  focusTaskId = null,
  onRefresh,
  onEditTask,
  onBreakdownTask,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [expandedSubtaskTaskId, setExpandedSubtaskTaskId] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // Universal Task Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Inline Quick Add Task state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");
  const [newPriority, setNewPriority] = useState<"URGENT" | "HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [isAdding, setIsAdding] = useState(false);

  // Check off a task
  const handleCheck = async (task: any) => {
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

  // Restore completed task
  const handleRestore = async (taskId: string) => {
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, action: "UNCOMPLETE" }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Generic task action
  const handleTaskAction = async (taskId: string, action: string, extraPayload?: any) => {
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, action, ...extraPayload }),
      });
      setActiveMenuId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle subtask
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          action: "TOGGLE_SUBTASK",
          subtaskId,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Create new task inline
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    try {
      await fetch("/api/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          effortMin: 30,
        }),
      });
      setNewTitle("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // Filter tasks: if focusTaskId exists, don't duplicate it in the normal list
  const pendingTasks = tasks.filter((t) => t.id !== focusTaskId);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-serif text-2xl font-semibold text-white tracking-tight">
            Today's Tasks
          </h2>
          <Badge variant="teal" size="md">
            {pendingTasks.length} Pending
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-orbit-amber hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Inline Quick Task Creator */}
      <form onSubmit={handleCreateTask} className="flex flex-wrap sm:flex-nowrap gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="+ Quick add task (e.g. 'Submit project draft', 'Review notes')..."
          className="flex-1 min-w-[200px] rounded-xl bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.09] px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 border border-white/[0.1] focus:border-orbit-amber/50 focus:outline-none transition-all font-sans"
        />

        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="rounded-xl bg-[#0B101D] px-2.5 py-2 text-xs font-mono text-slate-300 border border-white/[0.1] focus:outline-none focus:border-orbit-amber shrink-0"
        >
          {STANDARD_TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={newPriority}
          onChange={(e: any) => setNewPriority(e.target.value)}
          className="rounded-xl bg-[#0B101D] px-2.5 py-2 text-xs font-mono text-slate-300 border border-white/[0.1] focus:outline-none focus:border-orbit-amber shrink-0"
        >
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <GlassButton
          variant="accent"
          size="sm"
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="px-3.5 text-xs shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </GlassButton>
      </form>

      {/* Task Cards Stack */}
      <div className="space-y-2.5">
        {pendingTasks.length === 0 ? (
          <GlassCard level={1} className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-orbit-teal opacity-80" strokeWidth={1.5} />
            <p className="font-serif text-base text-white">All caught up for today!</p>
            <p className="text-xs text-slate-400">
              No additional tasks pending. Use the form above or Quick Capture to add new work.
            </p>
          </GlassCard>
        ) : (
          pendingTasks.map((task) => {
            const isCompleting = completingIds.has(task.id);
            const isCarried = (task.carriedCount || 0) > 0;
            const subtasks = task.subtasks || task.metadata?.subtasks || [];
            const completedSubtasks = subtasks.filter((s: any) => s.completed).length;
            const isSubtasksExpanded = expandedSubtaskTaskId === task.id;
            const taskPriority = task.priority || task.metadata?.priority || "MEDIUM";
            const isInProgress = task.status === "IN_PROGRESS";
            const isRecurring = Boolean(task.isRecurring || task.metadata?.isRecurring);
            const categoryBadgeCls = getCategoryBadgeColor(task.category);

            // Priority badge styling
            let priorityBadge = (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono border text-teal-300 border-teal-500/30 bg-teal-500/10">
                Medium
              </span>
            );
            if (taskPriority === "URGENT") {
              priorityBadge = (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-mono border text-rose-300 border-rose-500/40 bg-rose-500/15 animate-pulse font-semibold">
                  Urgent
                </span>
              );
            } else if (taskPriority === "HIGH") {
              priorityBadge = (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-mono border text-amber-300 border-amber-500/30 bg-amber-500/10 font-medium">
                  High
                </span>
              );
            } else if (taskPriority === "LOW" || taskPriority === "NORMAL") {
              priorityBadge = (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-mono border text-slate-400 border-slate-500/30 bg-slate-500/10">
                  Low
                </span>
              );
            }

            return (
              <GlassCard
                key={task.id}
                level={2}
                className={`group relative transition-all duration-300 p-4 ${
                  isCompleting ? "opacity-35 scale-[0.98]" : ""
                } ${isInProgress ? "border-orbit-amber/35 bg-[#0B101D]/90" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Checkbox & Task details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleCheck(task)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-orbit-teal transition-transform active:scale-90 cursor-pointer"
                      title="Mark complete"
                    >
                      {isCompleting ? (
                        <CheckCircle2 className="h-5 w-5 text-orbit-teal animate-bounce" strokeWidth={2} />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400 hover:text-white transition-colors" strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-medium tracking-tight text-white ${
                            isCompleting ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {task.title}
                        </span>

                        {priorityBadge}

                        {task.category && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono border ${categoryBadgeCls}`}>
                            {task.category}
                          </span>
                        )}

                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-orbit-amber/15 px-2 py-0.5 text-[10px] font-mono text-orbit-amber border border-orbit-amber/30">
                            <Play className="h-2.5 w-2.5 fill-orbit-amber" />
                            <span>In Progress</span>
                          </span>
                        )}

                        {isCarried && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                            <Clock className="h-3 w-3" />
                            <span>Carried {task.carriedCount}x</span>
                          </span>
                        )}

                        {isRecurring && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-mono text-teal-300 border border-teal-500/20" title={`Recurs ${task.recurringFrequency || "daily"}`}>
                            <Repeat className="h-2.5 w-2.5" />
                            <span>{task.recurringFrequency || "Daily"}</span>
                          </span>
                        )}
                      </div>

                      {/* Optional Description */}
                      {(task.description || task.metadata?.description) && (
                        <p className="text-xs text-slate-400 line-clamp-2 font-sans pt-0.5">
                          {task.description || task.metadata?.description}
                        </p>
                      )}

                      {/* Metas: Deadline, Duration, Subtasks toggle */}
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                        {task.dueAt && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(task.dueAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}

                        {task.effortMin && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="h-3 w-3" />
                            {task.effortMin}m
                          </span>
                        )}

                        {subtasks.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSubtaskTaskId(isSubtasksExpanded ? null : task.id)
                            }
                            className="flex items-center gap-1 text-orbit-teal hover:underline underline-offset-4 cursor-pointer"
                          >
                            <ListTodo className="h-3 w-3" />
                            <span>
                              {completedSubtasks}/{subtasks.length} steps
                            </span>
                            {isSubtasksExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expandable Subtask List */}
                      {isSubtasksExpanded && subtasks.length > 0 && (
                        <div className="pt-2 pl-1 space-y-1.5 border-t border-white/[0.06] mt-2">
                          {subtasks.map((st: any) => (
                            <div
                              key={st.id}
                              onClick={() => handleToggleSubtask(task.id, st.id)}
                              className="flex items-center gap-2 text-xs cursor-pointer text-slate-300 hover:text-white"
                            >
                              {st.completed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-orbit-teal shrink-0" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className={st.completed ? "line-through text-slate-500" : ""}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                      className="rounded-item p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="Task actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === task.id && (
                      <div className="absolute right-0 top-8 z-30 w-48 rounded-2xl bg-[#070B14]/98 backdrop-blur-2xl border border-white/[0.18] p-1.5 shadow-glass-3 space-y-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleTaskAction(task.id, "SET_FOCUS")}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-orbit-amber hover:bg-white/[0.1] transition-colors"
                        >
                          <Star className="h-3.5 w-3.5 fill-orbit-amber" />
                          <span>Make Today's Focus</span>
                        </button>

                        {!isInProgress && (
                          <button
                            type="button"
                            onClick={() => handleTaskAction(task.id, "CONTINUE_WORKING")}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                          >
                            <Play className="h-3.5 w-3.5 text-orbit-teal" />
                            <span>Continue Working</span>
                          </button>
                        )}

                        {onBreakdownTask && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onBreakdownTask(task);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                          >
                            <Scissors className="h-3.5 w-3.5 text-orbit-teal" />
                            <span>Break into Steps</span>
                          </button>
                        )}

                        {onEditTask && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEditTask(task);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit Details</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTaskAction(task.id, "RESCHEDULE")}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-slate-300 hover:bg-white/[0.1] hover:text-white transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span>Reschedule Tomorrow</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTaskAction(task.id, "CANCEL")}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-slate-400 hover:bg-white/[0.1] hover:text-slate-200 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Cancel Task</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTaskAction(task.id, "DELETE")}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Permanently</span>
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

      {/* Collapsible Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span>
              {showCompleted ? "Hide" : "Show"} Completed ({completedTasks.length})
            </span>
            {showCompleted ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {completedTasks.map((task) => (
                  <GlassCard key={task.id} level={1} className="p-3 rounded-xl border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-orbit-teal" />
                        <span className="text-xs font-sans line-through text-slate-500">
                          {task.title}
                        </span>
                        {task.category && (
                          <span className="text-[10px] font-mono text-slate-500">
                            ({task.category})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestore(task.id)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
                        title="Restore to pending"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Undo</span>
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Universal Task Creation Modal */}
      <UniversalTaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRefresh={onRefresh}
      />
    </div>
  );
};
