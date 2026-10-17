"use client";

import React, { useState } from "react";
import {
  Wallet,
  Target,
  AlertTriangle,
  Plus,
  Edit2,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Sliders,
  X,
  Trash2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from "@/lib/engine/money";

interface BudgetsSavingsTabProps {
  user: any;
  analysis: any;
  goals: any[];
  onRefresh: () => void;
}

export const BudgetsSavingsTab: React.FC<BudgetsSavingsTabProps> = ({
  user,
  analysis,
  goals = [],
  onRefresh,
}) => {
  // Modal states
  const [isEditMonthlyBudgetOpen, setIsEditMonthlyBudgetOpen] = useState(false);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState(
    user?.monthlyBudget ? String(user.monthlyBudget) : ""
  );

  const [isCategoryBudgetModalOpen, setIsCategoryBudgetModalOpen] = useState(false);
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<Record<string, string>>(() => {
    const existing = user?.categoryBudgets || {};
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(existing)) {
      res[k] = String(v);
    }
    return res;
  });
  const [newCatKey, setNewCatKey] = useState("Food");

  // Savings Goal Modals
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalColor, setGoalColor] = useState("#38BDF8");

  // Contribution Modal
  const [contributingGoal, setContributingGoal] = useState<any | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [recordAsExpense, setRecordAsExpense] = useState(false);

  const [loading, setLoading] = useState(false);

  // 1. Save Monthly Budget
  const handleSaveMonthlyBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const budget = parseFloat(monthlyBudgetInput) || 0;
      await fetch("/api/money/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: budget }),
      });
      setIsEditMonthlyBudgetOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Save Category Budgets
  const handleSaveCategoryBudgets = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(categoryBudgetInputs)) {
        const parsed = parseFloat(v);
        if (!isNaN(parsed) && parsed > 0) {
          clean[k] = parsed;
        }
      }
      await fetch("/api/money/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryBudgets: clean }),
      });
      setIsCategoryBudgetModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Save New Savings Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalTarget) return;
    setLoading(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle.trim(),
          targetValue: parseFloat(goalTarget),
          currentValue: parseFloat(goalCurrent) || 0,
          deadline: goalDeadline ? new Date(goalDeadline).toISOString() : null,
          color: goalColor,
        }),
      });
      setGoalTitle("");
      setGoalTarget("");
      setGoalCurrent("");
      setGoalDeadline("");
      setIsNewGoalModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Save Contribution
  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal || !contributionAmount) return;
    setLoading(true);
    try {
      const amt = parseFloat(contributionAmount);
      await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contributingGoal.id,
          contribution: amt,
        }),
      });

      // Optionally record as an EXPENSE linked to the goal
      if (recordAsExpense) {
        await fetch("/api/money", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Savings Contribution: ${contributingGoal.title}`,
            amount: amt,
            type: "EXPENSE",
            category: "Other",
            notes: `Allocated to ${contributingGoal.title}`,
            linkedGoalId: contributingGoal.id,
          }),
        });
      }

      setContributingGoal(null);
      setContributionAmount("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to remove this savings goal?")) return;
    try {
      await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const monthlyBudget = analysis?.monthlyBudget || 0;
  const spentThisMonth = analysis?.totalSpentThisMonth || 0;
  const remainingBudget = analysis?.remainingBudget || 0;
  const budgetPercentage = monthlyBudget > 0 ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100)) : 0;
  const isBudgetWarning = monthlyBudget > 0 && spentThisMonth >= monthlyBudget * 0.8 && spentThisMonth < monthlyBudget;
  const isBudgetExceeded = monthlyBudget > 0 && spentThisMonth >= monthlyBudget;

  const categoryBudgetsList = analysis?.categoryBudgets || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Overall Monthly Budget Card */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">Monthly Expense Budget</h3>
              <p className="text-xs text-slate-400 font-mono">
                Overall monthly spending cap & real-time runway
              </p>
            </div>
          </div>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setMonthlyBudgetInput(monthlyBudget > 0 ? String(monthlyBudget) : "");
              setIsEditMonthlyBudgetOpen(true);
            }}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            <span>{monthlyBudget > 0 ? "Edit Budget" : "Set Budget"}</span>
          </GlassButton>
        </div>

        {monthlyBudget === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <p className="text-sm font-serif font-medium text-white">No Monthly Budget Configured</p>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
              Setting an overall monthly spending limit helps calculate daily safe-to-spend caps and gives you proactive warnings before overspending.
            </p>
            <GlassButton
              variant="accent"
              size="sm"
              onClick={() => setIsEditMonthlyBudgetOpen(true)}
              className="mt-2"
            >
              Configure Monthly Budget
            </GlassButton>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Monthly Budget</span>
                <p className="font-mono text-xl font-bold text-white mt-0.5">
                  ₹{monthlyBudget.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Spent This Month</span>
                <p className={`font-mono text-xl font-bold mt-0.5 ${isBudgetExceeded ? "text-rose-400" : isBudgetWarning ? "text-amber-400" : "text-slate-200"}`}>
                  ₹{spentThisMonth.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Remaining Buffer</span>
                <p className={`font-mono text-xl font-bold mt-0.5 ${remainingBudget <= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  ₹{remainingBudget.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Spending Pace</span>
                <span className={isBudgetExceeded ? "text-rose-400 font-bold" : isBudgetWarning ? "text-amber-400 font-bold" : "text-slate-300"}>
                  {budgetPercentage}% consumed
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  style={{ width: `${Math.min(100, (spentThisMonth / monthlyBudget) * 100)}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    isBudgetExceeded
                      ? "bg-rose-500"
                      : isBudgetWarning
                      ? "bg-amber-400"
                      : "bg-desk-amber"
                  }`}
                />
              </div>
            </div>

            {/* Warning Banners */}
            {isBudgetExceeded && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>
                  Budget exceeded by ₹{(spentThisMonth - monthlyBudget).toLocaleString("en-IN")}! Reduce non-essential spending for the rest of this month.
                </span>
              </div>
            )}
            {isBudgetWarning && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Caution: You have utilized {budgetPercentage}% of your monthly budget with {analysis?.daysRemainingInMonth} days remaining.
                </span>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* 2. Category-Level Budgets */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-desk-teal/15 text-desk-teal border border-desk-teal/30">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">Category Budgets</h3>
              <p className="text-xs text-slate-400 font-mono">
                Set dedicated limits per category (e.g. Food, Shopping, Transport)
              </p>
            </div>
          </div>

          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setIsCategoryBudgetModalOpen(true)}
          >
            <Sliders className="h-3.5 w-3.5 mr-1" />
            <span>Manage Limits</span>
          </GlassButton>
        </div>

        {categoryBudgetsList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <p className="text-sm font-serif font-medium text-white">No Category Limits Configured</p>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
              Allocate individual limits for categories like Food, Transport, or Entertainment to prevent any single bucket from exceeding your expectations.
            </p>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryBudgetModalOpen(true)}
              className="mt-2"
            >
              + Set Category Budgets
            </GlassButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {categoryBudgetsList.map((cb: any) => {
              const isExceeded = cb.status === "exceeded";
              const isWarning = cb.status === "warning";

              return (
                <div
                  key={cb.category}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cb.color }}
                      />
                      <span className="text-sm font-medium text-white">{cb.category}</span>
                    </div>

                    <Badge
                      variant={isExceeded ? "rose" : isWarning ? "amber" : "teal"}
                      size="sm"
                    >
                      {isExceeded ? "Over Budget" : isWarning ? "Near Limit" : "On Track"}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-slate-400">
                      Spent ₹{cb.spent.toLocaleString("en-IN")} of ₹{cb.budget.toLocaleString("en-IN")}
                    </span>
                    <span className={isExceeded ? "text-rose-400 font-bold" : "text-slate-300"}>
                      {cb.percentage}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      style={{ width: `${Math.min(100, cb.percentage)}%`, backgroundColor: isExceeded ? "#F43F5E" : isWarning ? "#FBBF24" : cb.color }}
                      className="h-full transition-all duration-300 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* 3. Savings Goals */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">Savings Goals</h3>
              <p className="text-xs text-slate-400 font-mono">
                Target milestones, dedicated funds & contribution tracking
              </p>
            </div>
          </div>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => setIsNewGoalModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>New Savings Goal</span>
          </GlassButton>
        </div>

        {goals.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <Target className="h-6 w-6 text-slate-500 mx-auto" />
            <p className="text-sm font-serif font-medium text-white">No Savings Goals Created Yet</p>
            <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
              Create savings milestones for tech gear, travel, emergency fund, or tuition. Contributions are tracked transparently without double-counting expenses.
            </p>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setIsNewGoalModalOpen(true)}
              className="mt-2"
            >
              + Create First Savings Goal
            </GlassButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {goals.map((g: any) => {
              const target = Number(g.targetValue) || 1;
              const current = Number(g.currentValue) || 0;
              const percentage = Math.min(100, Math.round((current / target) * 100));
              const remaining = Math.max(0, target - current);
              const isCompleted = current >= target;

              const deadlineStr = g.deadline
                ? new Date(g.deadline).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-white">{g.title}</p>
                      {deadlineStr && (
                        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span>Target: {deadlineStr}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <Badge variant="teal" size="sm">
                          Completed
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {percentage}%
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all ml-1"
                        title="Delete goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span className="text-white font-bold">
                        ₹{current.toLocaleString("en-IN")}
                      </span>
                      <span className="text-slate-400">
                        of ₹{target.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        style={{ width: `${percentage}%`, backgroundColor: g.color || "#38BDF8" }}
                        className="h-full transition-all duration-300 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-400">
                      {isCompleted ? "Goal achieved! 🎉" : `₹${remaining.toLocaleString("en-IN")} left`}
                    </span>
                    <button
                      onClick={() => {
                        setContributingGoal(g);
                        setContributionAmount("");
                        setRecordAsExpense(false);
                      }}
                      className="text-xs font-mono font-semibold text-desk-amber hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Funds</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Modal: Edit Monthly Budget */}
      {isEditMonthlyBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-white">Monthly Expense Budget</h3>
              <button onClick={() => setIsEditMonthlyBudgetOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonthlyBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Budget Amount (₹)
                </label>
                <input
                  type="number"
                  value={monthlyBudgetInput}
                  onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                  placeholder="e.g. 15000"
                  required
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-base font-mono font-bold text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setIsEditMonthlyBudgetOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Budget"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category Budgets */}
      {isCategoryBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-serif text-base font-semibold text-white">Category Limits</h3>
              <button onClick={() => setIsCategoryBudgetModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
              {/* Add New Category Limit Row */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <select
                  value={newCatKey}
                  onChange={(e) => setNewCatKey(e.target.value)}
                  className="rounded-xl bg-[#090D16] px-3 py-2 text-xs text-white border border-white/[0.12] focus:outline-none flex-1"
                >
                  {DEFAULT_CATEGORIES.map((c: string) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (!categoryBudgetInputs[newCatKey]) {
                      setCategoryBudgetInputs((prev) => ({ ...prev, [newCatKey]: "5000" }));
                    }
                  }}
                >
                  + Add Category
                </GlassButton>
              </div>

              {/* List of active category budget inputs */}
              {Object.keys(categoryBudgetInputs).length === 0 ? (
                <p className="text-xs font-mono text-slate-400 text-center py-4">
                  No category limits added yet. Select a category above to assign a limit.
                </p>
              ) : (
                Object.entries(categoryBudgetInputs).map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-300 w-28 truncate">{cat}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">₹</span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) =>
                          setCategoryBudgetInputs((prev) => ({ ...prev, [cat]: e.target.value }))
                        }
                        placeholder="Limit in ₹"
                        className="w-full rounded-xl bg-white/[0.05] pl-7 pr-3 py-1.5 text-xs font-mono text-white border border-white/[0.1] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryBudgetInputs((prev) => {
                          const copy = { ...prev };
                          delete copy[cat];
                          return copy;
                        });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove category"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end gap-2">
              <GlassButton variant="ghost" size="sm" onClick={() => setIsCategoryBudgetModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="accent" size="sm" onClick={handleSaveCategoryBudgets} disabled={loading}>
                {loading ? "Saving..." : "Save All Limits"}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Savings Goal */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-serif text-base font-semibold text-white">New Savings Goal</h3>
              <button onClick={() => setIsNewGoalModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. New Laptop, Emergency Fund, Goa Trip"
                  required
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Initial Saved (₹)
                  </label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setIsNewGoalModalOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Goal"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Contribution */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="font-serif text-base font-semibold text-white">Add Contribution</h3>
                <p className="text-xs text-slate-400 font-mono">{contributingGoal.title}</p>
              </div>
              <button onClick={() => setContributingGoal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Contribution Amount (₹) *
                </label>
                <input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                  autoFocus
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-base font-mono font-bold text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recordAsExpense"
                  checked={recordAsExpense}
                  onChange={(e) => setRecordAsExpense(e.target.checked)}
                  className="h-4 w-4 rounded accent-desk-amber"
                />
                <label htmlFor="recordAsExpense" className="text-xs text-slate-300 font-mono">
                  Also record this as an Expense transaction
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setContributingGoal(null)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Recording..." : "Save Contribution"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
