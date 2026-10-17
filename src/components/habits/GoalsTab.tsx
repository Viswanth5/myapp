"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Layers,
  Pause,
  Play,
  Trash2,
  Edit2,
  Calendar,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import confetti from "canvas-confetti";

interface GoalsTabProps {
  goals: any[];
  onOpenCreateModal: () => void;
  onEditGoal: (goal: any) => void;
  onRefresh: () => void;
}

type FilterType = "all" | "in_progress" | "completed" | "paused" | "overdue";

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  onOpenCreateModal,
  onEditGoal,
  onRefresh,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});
  const [newMilestoneInput, setNewMilestoneInput] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Toggle milestone completion
  const handleToggleMilestone = async (goalId: string, milestoneId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#38BDF8", "#1F6F6B", "#E0A458"],
      });
    }

    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goalId,
          action: "TOGGLE_MILESTONE",
          milestoneId,
          completed: !currentCompleted,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Toggle milestone error:", err);
    }
  };

  // Add new milestone on the fly
  const handleAddMilestone = async (goalId: string) => {
    const title = newMilestoneInput[goalId]?.trim();
    if (!title) return;

    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goalId,
          action: "ADD_MILESTONE",
          milestoneTitle: title,
        }),
      });
      setNewMilestoneInput((prev) => ({ ...prev, [goalId]: "" }));
      onRefresh();
    } catch (err) {
      console.error("Add milestone error:", err);
    }
  };

  // Quick Status change (Pause / Resume / Complete)
  const handleStatusChange = async (goalId: string, newStatus: string) => {
    setActionLoadingId(goalId);
    try {
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goalId,
          status: newStatus,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Update status error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this goal and its recorded milestones?")) return;
    try {
      await fetch(`/api/goals?id=${goalId}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error("Delete goal error:", err);
    }
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoalIds((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Filter logic
  const filteredGoals = goals.filter((g) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") return g.status === "IN_PROGRESS" || g.status === "NOT_STARTED";
    if (activeFilter === "completed") return g.status === "COMPLETED";
    if (activeFilter === "paused") return g.status === "PAUSED";
    if (activeFilter === "overdue") return g.isOverdue;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filters and CTA Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          {[
            { id: "all", label: "All Goals", count: goals.length },
            {
              id: "in_progress",
              label: "In Progress",
              count: goals.filter((g) => g.status === "IN_PROGRESS" || g.status === "NOT_STARTED").length,
            },
            {
              id: "completed",
              label: "Completed",
              count: goals.filter((g) => g.status === "COMPLETED").length,
            },
            {
              id: "paused",
              label: "Paused",
              count: goals.filter((g) => g.status === "PAUSED").length,
            },
            {
              id: "overdue",
              label: "Overdue",
              count: goals.filter((g) => g.isOverdue).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as FilterType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? "bg-orbit-cyan/20 text-white font-medium border border-orbit-cyan/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        <GlassButton
          variant="accent"
          size="sm"
          onClick={onOpenCreateModal}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </GlassButton>
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 ? (
        <GlassCard className="p-10 text-center space-y-3 border-white/[0.08]">
          <div className="h-12 w-12 rounded-2xl bg-orbit-cyan/15 border border-orbit-cyan/30 text-orbit-cyan flex items-center justify-center mx-auto">
            <Target className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="font-serif text-lg font-medium text-white">
              {activeFilter === "all" ? "No goals recorded yet" : `No ${activeFilter.replace("_", " ")} goals`}
            </h4>
            <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto pt-1">
              {activeFilter === "all"
                ? "Define your personal, career, academic, or financial milestones and track tangible progress without friction."
                : "Switch filter tabs to review other goals, or create a new milestone."}
            </p>
          </div>
          {activeFilter === "all" && (
            <div className="pt-2">
              <GlassButton variant="primary" size="sm" onClick={onOpenCreateModal}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span>Create Your First Goal</span>
              </GlassButton>
            </div>
          )}
        </GlassCard>
      ) : (
        /* Goals Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const isExpanded = expandedGoalIds[goal.id] ?? true;
            const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
            const progress = goal.progressPercentage ?? 0;

            const categoryColors: Record<string, string> = {
              Personal: "text-pink-400 border-pink-400/30 bg-pink-400/10",
              Career: "text-amber-400 border-amber-400/30 bg-amber-400/10",
              Education: "text-teal-400 border-teal-400/30 bg-teal-400/10",
              Finance: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
              "Health & Fitness": "text-sky-400 border-sky-400/30 bg-sky-400/10",
              Relationships: "text-purple-400 border-purple-400/30 bg-purple-400/10",
              Custom: "text-orange-400 border-orange-400/30 bg-orange-400/10",
            };

            const catBadgeClass = categoryColors[goal.category] || "text-slate-300 border-white/20 bg-white/5";

            return (
              <GlassCard
                key={goal.id}
                level={2}
                className={`p-5 space-y-4 border-white/[0.12] transition-all ${
                  goal.status === "COMPLETED"
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : goal.isOverdue
                    ? "border-rose-500/30"
                    : ""
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${catBadgeClass}`}>
                        {goal.category}
                      </span>
                      {goal.isOverdue && (
                        <Badge variant="rose" size="sm">
                          Overdue
                        </Badge>
                      )}
                      {goal.status === "PAUSED" && (
                        <Badge variant="outline" size="sm">
                          Paused
                        </Badge>
                      )}
                      {goal.status === "COMPLETED" && (
                        <Badge variant="teal" size="sm">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-serif text-lg font-semibold text-white tracking-tight">
                      {goal.title}
                    </h4>
                    {goal.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {goal.status === "PAUSED" ? (
                      <button
                        title="Resume Goal"
                        onClick={() => handleStatusChange(goal.id, "IN_PROGRESS")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    ) : goal.status === "IN_PROGRESS" ? (
                      <button
                        title="Pause Goal"
                        onClick={() => handleStatusChange(goal.id, "PAUSED")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    ) : null}

                    <button
                      title="Edit Goal"
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      title="Delete Goal"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      {goal.trackingType === "MILESTONE"
                        ? `${goal.completedMilestonesCount || 0} of ${goal.totalMilestonesCount || 0} milestones`
                        : goal.trackingType === "TASK"
                        ? `${goal.linkedTasksCompletedCount || 0} of ${goal.linkedTasksCount || 0} tasks done`
                        : `${goal.currentValue || 0} / ${goal.targetValue || 100} ${goal.unit || "%"}`}
                    </span>
                    <span className="font-bold text-orbit-cyan">{progress}%</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      style={{ width: `${progress}%` }}
                      className={`h-full transition-all duration-500 ${
                        goal.status === "COMPLETED"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : "bg-gradient-to-r from-orbit-cyan to-orbit-teal"
                      }`}
                    />
                  </div>
                </div>

                {/* Meta details: Deadline, tracking method */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    {goal.deadline ? (
                      <span>
                        Target:{" "}
                        {new Date(goal.deadline).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {goal.daysRemaining !== null && (
                          <span
                            className={`ml-1 ${
                              goal.isOverdue
                                ? "text-rose-400"
                                : goal.daysRemaining <= 7
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            ({goal.isOverdue ? `${Math.abs(goal.daysRemaining)}d overdue` : `${goal.daysRemaining}d left`})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Continuous Target</span>
                    )}
                  </div>

                  <span className="text-[10px] uppercase text-slate-500">
                    {goal.trackingType === "MILESTONE"
                      ? "Milestone Tracking"
                      : goal.trackingType === "TASK"
                      ? "Desk Task Sync"
                      : "Numeric Target"}
                  </span>
                </div>

                {/* Milestones Checklist Accordion */}
                {milestones.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => toggleExpand(goal.id)}
                      className="flex items-center justify-between w-full text-xs font-mono text-slate-300 hover:text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-orbit-cyan" />
                        <span>Milestones Checklist</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1.5 pt-1">
                        {milestones.map((m: any) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleToggleMilestone(goal.id, m.id, m.completed)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                              m.completed
                                ? "bg-emerald-500/10 text-slate-400 line-through border border-emerald-500/20"
                                : "bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] border border-white/[0.05]"
                            }`}
                          >
                            {m.completed ? (
                              <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{m.title}</span>
                          </button>
                        ))}

                        {/* Quick inline milestone add */}
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newMilestoneInput[goal.id] || ""}
                            onChange={(e) =>
                              setNewMilestoneInput({
                                ...newMilestoneInput,
                                [goal.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddMilestone(goal.id);
                              }
                            }}
                            placeholder="+ Add next milestone..."
                            className="flex-1 rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-white placeholder-slate-500 border border-white/[0.08] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddMilestone(goal.id)}
                            className="px-2.5 py-1 rounded-lg bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30 text-xs font-mono hover:bg-orbit-cyan/30"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
