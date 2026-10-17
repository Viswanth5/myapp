"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  Fuel,
  Compass,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLORS } from "@/lib/engine/money";

interface FinanceChartsTabProps {
  transactions: any[];
  analysis: any;
  bikeAnalytics?: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl bg-[#0b101d]/95 backdrop-blur-xl border border-white/[0.14] p-3 shadow-2xl space-y-1 z-50 text-xs font-mono">
        {label && <p className="text-slate-300 font-semibold mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-bold text-white">
              {typeof entry.value === "number"
                ? `₹${entry.value.toLocaleString("en-IN")}`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FinanceChartsTab: React.FC<FinanceChartsTabProps> = ({
  transactions = [],
  analysis,
  bikeAnalytics,
}) => {
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "all">("30d");

  // Filter transactions by time
  const filteredTxs = useMemo(() => {
    if (timeFilter === "all") return transactions;
    const now = new Date();
    const days = timeFilter === "7d" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return transactions.filter((tx) => {
      const d = new Date(tx.dueAt || tx.createdAt || 0);
      return d >= cutoff;
    });
  }, [transactions, timeFilter]);

  // 1. Cashflow Timeline Data
  const timelineData = useMemo(() => {
    if (filteredTxs.length === 0) return [];

    const map = new Map<string, { date: string; income: number; expense: number; timestamp: number }>();

    filteredTxs.forEach((tx) => {
      const dt = new Date(tx.dueAt || tx.createdAt || 0);
      const label = dt.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const current = map.get(label) || { date: label, income: 0, expense: 0, timestamp: dt.getTime() };
      const amt = Number(tx.amount) || 0;

      if (tx.type === "INCOME") {
        current.income += amt;
      } else if (tx.type === "EXPENSE") {
        current.expense += amt;
      }
      map.set(label, current);
    });

    return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredTxs]);

  // 2. Category Expense Breakdown
  const categoryData = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === "EXPENSE");
    const map = new Map<string, number>();

    expenses.forEach((t) => {
      const cat = t.category || "General";
      const amt = Number(t.amount) || 0;
      map.set(cat, (map.get(cat) || 0) + amt);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || "#94A3B8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // 3. Category Budget vs Actual
  const budgetVsActualData = useMemo(() => {
    const list = analysis?.categoryBudgets || [];
    if (list.length === 0) return [];

    return list.map((cb: any) => ({
      category: cb.category,
      budget: cb.budget,
      spent: cb.spent,
    }));
  }, [analysis]);

  // 4. Bike Mileage Intervals Data
  const mileageIntervalsData = useMemo(() => {
    const intervals = bikeAnalytics?.intervals || [];
    return intervals.map((inv: any, idx: number) => ({
      refill: `#${idx + 1} (${inv.distanceKm} km)`,
      mileage: inv.mileageKmPerLitre,
      costPerKm: inv.costPerKm,
    }));
  }, [bikeAnalytics]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Time Filter Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Visual Analytics</h3>
          <p className="text-xs text-slate-400 font-mono">
            Interactive charts populated strictly from your recorded transactions
          </p>
        </div>

        <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08] text-xs font-mono">
          <button
            onClick={() => setTimeFilter("7d")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              timeFilter === "7d" ? "bg-white/[0.12] text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeFilter("30d")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              timeFilter === "30d" ? "bg-white/[0.12] text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeFilter("all")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              timeFilter === "all" ? "bg-white/[0.12] text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Grid: Cashflow Timeline + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cashflow (Income vs Expenses) */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h4 className="font-serif text-base font-medium text-white">Cashflow Over Time</h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs font-mono text-slate-400 space-y-1">
                <Calendar className="h-6 w-6 text-slate-500" />
                <p>No transaction history for selected period.</p>
                <p className="text-[11px] text-slate-500">Record income or expenses to visualize cash flow trends.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 2: Category Breakdown Donut */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-desk-amber" />
              <h4 className="font-serif text-base font-medium text-white">Expense Distribution</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">By Category</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs font-mono text-slate-400 space-y-1">
                <PieIcon className="h-6 w-6 text-slate-500" />
                <p>No expenses recorded in this period.</p>
                <p className="text-[11px] text-slate-500">Expenses will be grouped into categories here.</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center">
                <div className="h-full flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-44 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-300 truncate">{cat.name}</span>
                      </div>
                      <span className="text-white font-bold shrink-0">
                        ₹{cat.value.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Grid: Budget vs Actual + Bike Mileage Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Budget vs Actual */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-desk-teal" />
              <h4 className="font-serif text-base font-medium text-white">Budget vs Actual Spending</h4>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-desk-teal">
                <span className="h-2 w-2 rounded-full bg-desk-teal" /> Limit
              </span>
              <span className="flex items-center gap-1 text-desk-amber">
                <span className="h-2 w-2 rounded-full bg-desk-amber" /> Spent
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {budgetVsActualData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs font-mono text-slate-400 space-y-1">
                <BarChart3 className="h-6 w-6 text-slate-500" />
                <p>No category budgets configured.</p>
                <p className="text-[11px] text-slate-500">
                  Set category limits in the Budgets & Savings tab to compare target vs actual spend.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="budget" name="Budget Limit" fill="#1F6F6B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="spent" name="Actual Spent" fill="#E0A458" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Chart 4: Bike Mileage Intervals Trend */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-sky-400" />
              <h4 className="font-serif text-base font-medium text-white">Bike Mileage per Refill</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">Tank-to-Tank (km/L)</span>
          </div>

          <div className="h-64 w-full">
            {mileageIntervalsData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs font-mono text-slate-400 space-y-1">
                <Compass className="h-6 w-6 text-slate-500" />
                <p>No consecutive fuel refill intervals recorded.</p>
                <p className="text-[11px] text-slate-500">
                  Mileage trends require 2+ fuel logs with odometer readings.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mileageIntervalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="refill" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v} km/L`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mileage" name="Mileage (km/L)" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
