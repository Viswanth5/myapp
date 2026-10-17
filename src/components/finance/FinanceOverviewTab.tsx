"use client";

import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Target,
  Clock,
  Plus,
  ArrowRight,
  AlertTriangle,
  Bike,
  Sparkles,
  Edit2,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLORS } from "@/lib/engine/money";

interface FinanceOverviewTabProps {
  user: any;
  analysis: any;
  transactions: any[];
  recurringSpends: any[];
  goals: any[];
  bikeAnalytics?: any;
  onOpenAddModal: () => void;
  onOpenAddFuel: () => void;
  onNavigateTab: (tabKey: string) => void;
  onEditTransaction: (tx: any) => void;
  onRefresh: () => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  user,
  analysis,
  transactions = [],
  recurringSpends = [],
  goals = [],
  bikeAnalytics,
  onOpenAddModal,
  onOpenAddFuel,
  onNavigateTab,
  onEditTransaction,
  onRefresh,
}) => {
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState(
    user?.startingBalance ? String(user.startingBalance) : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSaveOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const val = parseFloat(openingBalanceInput) || 0;
      await fetch("/api/money/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startingBalance: val }),
      });
      setIsOpeningBalanceModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasRecordedData = analysis?.hasRecordedData || transactions.length > 0 || (user?.startingBalance > 0);
  const totalBalance = analysis?.totalBalance ?? (user?.startingBalance || 0);
  const totalIncome = analysis?.totalIncomeThisMonth ?? 0;
  const totalExpense = analysis?.totalSpentThisMonth ?? 0;
  const monthlyBudget = analysis?.monthlyBudget || 0;
  const remainingBudget = analysis?.remainingBudget || 0;
  const hasBudget = monthlyBudget > 0;
  const isBudgetExceeded = hasBudget && totalExpense >= monthlyBudget;
  const isBudgetWarning = hasBudget && totalExpense >= monthlyBudget * 0.8 && totalExpense < monthlyBudget;

  const activeRecurring = recurringSpends.filter((r) => r.status === "ACTIVE");
  const upcomingRecurring = activeRecurring.slice(0, 3);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Balance */}
        <GlassCard variant="hero" className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Net Balance</span>
            {hasRecordedData ? (
              <Badge variant="teal" size="sm">
                Calculated
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                Unconfigured
              </Badge>
            )}
          </div>

          {hasRecordedData ? (
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-bold text-white tabular-nums">
                  ₹{Number(totalBalance).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Opening (₹{Number(user?.startingBalance || 0).toLocaleString("en-IN")}) + Income - Spent
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-2xl font-bold text-slate-400">₹0</p>
              <button
                onClick={() => setIsOpeningBalanceModalOpen(true)}
                className="text-[11px] font-mono text-desk-amber hover:underline flex items-center gap-1"
              >
                + Set Opening Balance
              </button>
            </div>
          )}
        </GlassCard>

        {/* Card 2: Income This Month */}
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Income (This Month)</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">
              ₹{Number(totalIncome).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {transactions.filter((t) => t.type === "INCOME").length} recorded income entries
          </p>
        </GlassCard>

        {/* Card 3: Expenses This Month */}
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Expenses (This Month)</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-white tabular-nums">
              ₹{Number(totalExpense).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Avg ₹{analysis?.burnRatePerDay || 0}/day burn rate
          </p>
        </GlassCard>

        {/* Card 4: Remaining Budget */}
        <GlassCard variant={isBudgetExceeded ? "default" : "amber"} className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Remaining Budget</span>
            {hasBudget ? (
              <Badge variant={isBudgetExceeded ? "rose" : isBudgetWarning ? "amber" : "outline"} size="sm">
                {isBudgetExceeded ? "Exceeded" : isBudgetWarning ? "Caution" : `₹${monthlyBudget}`}
              </Badge>
            ) : (
              <Badge variant="outline" size="sm">
                No Cap
              </Badge>
            )}
          </div>

          {hasBudget ? (
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-3xl font-bold tabular-nums ${isBudgetExceeded ? "text-rose-400" : "text-desk-amber"}`}>
                  ₹{Number(remainingBudget).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400 font-mono">left</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {analysis?.dailySafeToSpend ? `Safe cap: ₹${analysis.dailySafeToSpend}/day` : `${analysis?.daysRemainingInMonth} days remaining`}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-mono text-2xl font-bold text-slate-400">Not set</p>
              <button
                onClick={() => onNavigateTab("budgets")}
                className="text-[11px] font-mono text-desk-amber hover:underline"
              >
                + Configure Monthly Limit
              </button>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick Action Banner */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-desk-amber" />
          <span className="text-xs font-mono text-slate-300">
            Quick Actions: Record spends as they occur to keep budget pacing accurate.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" size="sm" onClick={onOpenAddFuel}>
            <Bike className="h-3.5 w-3.5 mr-1" />
            <span>Log Petrol</span>
          </GlassButton>
          <GlassButton variant="accent" size="sm" onClick={onOpenAddModal}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Record Spend</span>
          </GlassButton>
        </div>
      </div>

      {/* Two Column Layout: Savings & Recurring Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Goals Widget */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-sky-400" />
              <h3 className="font-serif text-base font-semibold text-white">Savings Goals Progress</h3>
            </div>
            <button
              onClick={() => onNavigateTab("budgets")}
              className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
              <p className="text-xs font-mono text-slate-400">
                No savings milestones created. Define goals for vacations, emergency buffers, or tech purchases.
              </p>
              <GlassButton variant="secondary" size="sm" onClick={() => onNavigateTab("budgets")}>
                + Create Savings Goal
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => {
                const target = Number(g.targetValue) || 1;
                const current = Number(g.currentValue) || 0;
                const pct = Math.min(100, Math.round((current / target) * 100));

                return (
                  <div key={g.id} className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{g.title}</span>
                      <span className="font-mono text-sky-400 font-semibold">{pct}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: g.color || "#38BDF8" }}
                        className="h-full rounded-full transition-all duration-300"
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>₹{current.toLocaleString("en-IN")} saved</span>
                      <span>Target: ₹{target.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Upcoming Recurring Commitments Widget */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-desk-amber" />
              <h3 className="font-serif text-base font-semibold text-white">Upcoming Commitments</h3>
            </div>
            <button
              onClick={() => onNavigateTab("recurring")}
              className="text-xs font-mono text-desk-amber hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {upcomingRecurring.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
              <p className="text-xs font-mono text-slate-400">
                No active recurring subscriptions or rent scheduled.
              </p>
              <GlassButton variant="secondary" size="sm" onClick={() => onNavigateTab("recurring")}>
                + Add Recurring Commitment
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRecurring.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{rec.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      Due: {rec.nextDueDate ? new Date(rec.nextDueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : `Day ${rec.dayOfMonth}`} • {rec.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      ₹{Number(rec.amount).toLocaleString("en-IN")}
                    </span>
                    <Badge variant={rec.isPaid ? "teal" : "outline"} size="sm">
                      {rec.isPaid ? "Paid" : "Due Soon"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Transactions Widget */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-desk-amber" />
            <h3 className="font-serif text-base font-semibold text-white">Recent Financial Transactions</h3>
          </div>
          <button
            onClick={() => onNavigateTab("transactions")}
            className="text-xs font-mono text-desk-amber hover:underline flex items-center gap-0.5"
          >
            <span>View All ({transactions.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
            <p className="text-xs font-mono text-slate-400">
              No transactions recorded yet. Keep your finances synchronized by logging everyday spends.
            </p>
            <GlassButton variant="accent" size="sm" onClick={onOpenAddModal}>
              + Record Spend
            </GlassButton>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recentTransactions.map((tx) => {
              const isExpense = tx.type === "EXPENSE";
              const catColor = CATEGORY_COLORS[tx.category] || "#94A3B8";
              const formattedDate = new Date(tx.dueAt || tx.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-3 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                        isExpense
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {isExpense ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white group-hover:text-desk-amber transition-colors">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                          {tx.category || "General"}
                        </span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        {tx.metadata?.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{tx.metadata.paymentMethod}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      isExpense ? "text-slate-200" : "text-emerald-400"
                    }`}
                  >
                    {isExpense ? `-₹${Number(tx.amount).toLocaleString("en-IN")}` : `+₹${Number(tx.amount).toLocaleString("en-IN")}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Modal: Set Opening Balance */}
      {isOpeningBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-serif text-base font-semibold text-white">Opening Total Balance</h3>
              <button onClick={() => setIsOpeningBalanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOpeningBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Initial Starting Balance (₹)
                </label>
                <input
                  type="number"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  placeholder="e.g. 25000"
                  required
                  autoFocus
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-base font-mono font-bold text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                This serves as your baseline bank/cash balance. Recorded income adds to this, and recorded expenses deduct from this.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setIsOpeningBalanceModalOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Baseline"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
