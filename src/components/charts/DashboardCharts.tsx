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
  IndianRupee,
  CheckCircle2,
  Flame,
  Target,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardChartsProps {
  user: any;
  transactions?: any[];
  tasks?: any[];
  completedTasks?: any[];
  habits?: any[];
  goals?: any[];
}

type TabType = "all" | "finance" | "tasks" | "habits";
type TimeRangeType = "7d" | "30d" | "all";

const PALETTE = [
  "#1F6F6B", // Desk Teal
  "#E0A458", // Desk Amber
  "#38BDF8", // Sky
  "#34D399", // Emerald
  "#A78BFA", // Violet
  "#F472B6", // Rose
  "#FBBF24", // Yellow
];

// Custom Glassmorphic Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl bg-[#0b101d]/95 backdrop-blur-xl border border-white/[0.14] p-3 shadow-2xl space-y-1 z-50 text-xs">
        {label && <p className="font-mono text-slate-300 font-semibold mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-slate-300 font-medium">{entry.name}:</span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === "number"
                ? entry.value >= 100 && (entry.name?.includes("Expense") || entry.name?.includes("Income") || entry.name?.includes("Budget") || entry.name?.includes("Spent"))
                  ? `₹${entry.value.toLocaleString("en-IN")}`
                  : entry.value
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  user,
  transactions = [],
  tasks = [],
  completedTasks = [],
  habits = [],
  goals = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeType>("30d");

  // Date filtering logic based on selected time range
  const dateCutoff = useMemo(() => {
    if (timeRange === "all") return null;
    const now = new Date();
    const days = timeRange === "7d" ? 7 : 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }, [timeRange]);

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    if (!dateCutoff) return transactions;
    return transactions.filter((tx) => {
      const d = tx.createdAt ? new Date(tx.createdAt) : null;
      return d ? d >= dateCutoff : true;
    });
  }, [transactions, dateCutoff]);

  // 1. Finance: Cashflow Timeline (Income vs Expenses)
  const cashflowData = useMemo(() => {
    if (filteredTxs.length === 0) return [];

    // Group by date (day)
    const map = new Map<string, { date: string; income: number; expense: number }>();

    // Sort chronologically
    const sorted = [...filteredTxs].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    sorted.forEach((tx) => {
      const dt = tx.createdAt ? new Date(tx.createdAt) : new Date();
      const label = dt.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const current = map.get(label) || { date: label, income: 0, expense: 0 };
      const amount = Number(tx.amount || 0);

      if (tx.type === "INCOME") {
        current.income += amount;
      } else if (tx.type === "EXPENSE") {
        current.expense += amount;
      }
      map.set(label, current);
    });

    return Array.from(map.values());
  }, [filteredTxs]);

  // 2. Finance: Expense Breakdown by Category
  const expenseCategoryData = useMemo(() => {
    const expenses = filteredTxs.filter((t) => t.type === "EXPENSE");
    if (expenses.length === 0) return [];

    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const cat = e.category || "Personal";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // 3. Finance: Budget vs Actual
  const budgetVsActual = useMemo(() => {
    const monthlyBudget = Number(user?.monthlyBudget || 0);
    const totalSpent = filteredTxs
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    if (monthlyBudget === 0 && totalSpent === 0) return null;

    return [
      { name: "Monthly Budget", amount: monthlyBudget, fill: "#1F6F6B" },
      { name: "Current Spend", amount: totalSpent, fill: totalSpent > monthlyBudget && monthlyBudget > 0 ? "#F43F5E" : "#E0A458" },
    ];
  }, [user, filteredTxs]);

  // 4. Tasks: Status & Priority Distribution
  const allTasksList = useMemo(() => [...tasks, ...completedTasks], [tasks, completedTasks]);

  const taskStatusData = useMemo(() => {
    if (allTasksList.length === 0) return [];

    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    allTasksList.forEach((t) => {
      if (t.status === "COMPLETED") completed++;
      else if (t.status === "IN_PROGRESS") inProgress++;
      else pending++;
    });

    return [
      { name: "Completed", count: completed, fill: "#34D399" },
      { name: "In Progress", count: inProgress, fill: "#38BDF8" },
      { name: "Pending", count: pending, fill: "#E0A458" },
    ].filter((item) => item.count > 0);
  }, [allTasksList]);

  // Tasks by Category
  const taskCategoryData = useMemo(() => {
    if (allTasksList.length === 0) return [];
    const map = new Map<string, number>();
    allTasksList.forEach((t) => {
      const cat = t.category || "General";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allTasksList]);

  // 5. Habits: Frequency vs Streak Trends
  const habitsData = useMemo(() => {
    if (habits.length === 0) return [];
    return habits.map((h) => ({
      name: h.name || "Habit",
      streak: Number(h.streakCount || 0),
      targetPerWeek: Number(h.frequencyDays || 5),
    }));
  }, [habits]);

  // 6. Goals Progress
  const goalsProgressData = useMemo(() => {
    if (goals.length === 0) return [];
    return goals.map((g) => {
      const current = Number(g.currentValue || 0);
      const target = Number(g.targetValue || 100);
      const percent =
        g.progressPercentage !== undefined
          ? g.progressPercentage
          : target > 0
          ? Math.min(100, Math.round((current / target) * 100))
          : 0;
      return {
        title: g.title || "Goal",
        current,
        target,
        progress: percent,
        category: g.category || "General",
      };
    });
  }, [goals]);

  // Check if any data exists
  const hasFinanceData = cashflowData.length > 0 || expenseCategoryData.length > 0 || budgetVsActual !== null;
  const hasTaskData = allTasksList.length > 0;
  const hasHabitOrGoalData = habits.length > 0 || goals.length > 0;

  return (
    <div className="space-y-4">
      {/* Analytics Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-desk-teal/20 text-desk-teal border border-desk-teal/30">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Interactive Desk Analytics</span>
              <span className="text-[10px] font-mono text-desk-amber uppercase tracking-wider px-2 py-0.5 rounded-full bg-desk-amber/10 border border-desk-amber/25">
                Live Data
              </span>
            </h2>
            <p className="text-[11px] font-mono text-slate-400">
              Aggregated from your authenticated workspace records
            </p>
          </div>
        </div>

        {/* Filters: Category Tabs + Time Range Pill */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tab Filter */}
          <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] text-xs font-mono">
            {(
              [
                { id: "all", label: "Overview" },
                { id: "finance", label: "Finance" },
                { id: "tasks", label: "Tasks" },
                { id: "habits", label: "Habits & Goals" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? "bg-desk-teal text-white shadow-teal-subtle font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Range Pill */}
          <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/[0.08] text-[11px] font-mono">
            {(
              [
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "all", label: "All" },
              ] as const
            ).map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-2.5 py-0.5 rounded-lg transition-all ${
                  timeRange === range.id
                    ? "bg-white/[0.14] text-desk-amber font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ================= SECTION: FINANCE CHARTS ================= */}
        {(activeTab === "all" || activeTab === "finance") && (
          <>
            {/* 1. Cashflow Timeline */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-desk-teal" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Income vs Expenses Over Time
                  </h3>
                </div>
                <Badge variant="teal" size="sm">
                  Cashflow
                </Badge>
              </div>

              {cashflowData.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1F6F6B" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#1F6F6B" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E0A458" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#E0A458" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingBottom: "10px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#1F6F6B"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#incomeGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#E0A458"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#expenseGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <IndianRupee className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No cashflow data recorded yet</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Add transactions to see your real spending trends and cash balance over time.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* 2. Expense Category Breakdown */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-desk-amber" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Expense Breakdown by Category
                  </h3>
                </div>
                <Badge variant="amber" size="sm">
                  Distribution
                </Badge>
              </div>

              {expenseCategoryData.length > 0 ? (
                <div className="h-60 w-full flex items-center justify-center pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PALETTE[index % PALETTE.length]}
                            stroke="#0b101d"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <PieIcon className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No category expenses yet</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Categorize your expenses (Food, Travel, Academics, Tech) to see where your money goes.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* 3. Monthly Spend vs Budget */}
            {budgetVsActual && (
              <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-desk-amber" />
                    <h3 className="font-serif text-base font-medium text-white">
                      Monthly Spending vs Planned Budget
                    </h3>
                  </div>
                  <Badge variant="outline" size="sm">
                    Budget Comparison
                  </Badge>
                </div>

                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={budgetVsActual}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                        tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "sans-serif" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* ================= SECTION: TASKS & PRODUCTIVITY ================= */}
        {(activeTab === "all" || activeTab === "tasks") && (
          <>
            {/* Task Status Overview */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Task Completion Trend
                  </h3>
                </div>
                <Badge variant="teal" size="sm">
                  Productivity
                </Badge>
              </div>

              {taskStatusData.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Tasks" radius={[8, 8, 0, 0]}>
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-task-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No tasks created yet</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Create tasks using AI Quick Capture or New Task to track your velocity and completion rate.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Tasks by Category */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-400" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Tasks Grouped by Category
                  </h3>
                </div>
                <Badge variant="outline" size="sm">
                  Focus Allocation
                </Badge>
              </div>

              {taskCategoryData.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={taskCategoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "sans-serif" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Tasks" fill="#38BDF8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <Layers className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No category distributions</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Tag tasks with categories like Academics, Career, Personal, or Health to visualize balance.
                  </p>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {/* ================= SECTION: HABITS & GOALS ================= */}
        {(activeTab === "all" || activeTab === "habits") && (
          <>
            {/* Habits Consistency */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-desk-amber" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Habit Consistency & Target Frequency
                  </h3>
                </div>
                <Badge variant="amber" size="sm">
                  Habit Streaks
                </Badge>
              </div>

              {habitsData.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "sans-serif" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }}
                      />
                      <Bar dataKey="streak" name="Current Streak" fill="#E0A458" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="targetPerWeek" name="Target Days/Wk" fill="#1F6F6B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <Flame className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No habit routines configured</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Start tracking daily habits (Reading, Coding, Meditation, Workouts) to observe consistency streaks.
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Goals Milestone Progress */}
            <GlassCard level={2} className="p-5 space-y-4 border-white/[0.12] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-sky-400" />
                  <h3 className="font-serif text-base font-medium text-white">
                    Goal Completion Progress
                  </h3>
                </div>
                <Badge variant="teal" size="sm">
                  Milestones
                </Badge>
              </div>

              {goalsProgressData.length > 0 ? (
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={goalsProgressData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="title"
                        stroke="#64748b"
                        tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "sans-serif" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="progress" name="Progress %" fill="#38BDF8" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <Target className="h-8 w-8 text-slate-500 stroke-[1.25]" />
                  <p className="text-xs font-serif text-slate-300">No active goals yet</p>
                  <p className="text-[11px] font-mono text-slate-400 max-w-xs">
                    Define personal, academic, or financial milestones to track quantified progress.
                  </p>
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
};
