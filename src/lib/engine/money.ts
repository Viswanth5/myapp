export interface TransactionItem {
  id: string;
  amount: number;
  type: "EXPENSE" | "INCOME";
  category?: string | null;
  subcategory?: string | null;
  title: string;
  createdAt: Date | string;
  dueAt?: Date | string | null;
  paymentMethod?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
}

export interface RecurringCommitment {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // day of month (e.g. 5 for 5th)
  category: string;
  frequency?: "MONTHLY" | "WEEKLY" | "YEARLY" | string;
  status?: "ACTIVE" | "PAUSED" | "CANCELLED" | string;
  nextDueDate?: Date | string | null;
  notes?: string | null;
  isPaidThisMonth: boolean;
}

export interface CategoryBudgetStatus {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  color: string;
}

export interface SavingsGoalProgress {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
  remaining: number;
  color: string;
  deadline?: string | null;
}

export interface MoneyRunwayAnalysis {
  // Opening & Current Net Balance
  startingBalance: number;
  totalBalance: number;
  hasRecordedData: boolean;

  // Selected Period Totals
  monthlyBudget: number;
  totalSpentThisMonth: number;
  totalIncomeThisMonth: number;
  remainingBudget: number;
  daysRemainingInMonth: number;
  dailySafeToSpend: number;
  runwayDays: number; // estimated days remaining balance can sustain
  burnRatePerDay: number;
  budgetHealth: "healthy" | "cautious" | "critical";

  // Category & Budget Tracking
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  categoryBudgets: CategoryBudgetStatus[];

  // Recurring & Commitments
  recurringCommitments: RecurringCommitment[];
  upcomingRecurringTotal: number;

  // Savings Goals
  savingsGoals: SavingsGoalProgress[];
  totalSavedAcrossGoals: number;

  driftAlert?: string;
}

// Curated modern color tokens for all default and custom categories
export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#E0A458",
  Transport: "#38BDF8",
  Education: "#1F6F6B",
  Housing: "#F472B6",
  Shopping: "#A78BFA",
  Healthcare: "#34D399",
  Entertainment: "#FB923C",
  Salary: "#10B981",
  "Freelance Income": "#06B6D4",
  Academics: "#1F6F6B",
  Mess: "#9E6482",
  Tech: "#818CF8",
  Personal: "#F472B6",
  Health: "#34D399",
  Allowance: "#10B981",
  Other: "#94A3B8",
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Education",
  "Housing",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Tech",
  "Personal",
  "Other",
];

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance Income",
  "Allowance",
  "Investment",
  "Gift",
  "Other",
];

export const DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES.filter((c) => c !== "Other"),
  ...DEFAULT_INCOME_CATEGORIES.filter((c) => c !== "Other"),
  "Other",
];

export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Other",
];

export const DEFAULT_RECURRING: RecurringCommitment[] = [];

export function calculateMoneyRunway(
  transactions: TransactionItem[],
  monthlyBudget: number = 0,
  recurring: RecurringCommitment[] = [],
  optionsOrNow:
    | Date
    | {
        startingBalance?: number;
        categoryBudgets?: Record<string, number>;
        goals?: any[];
        now?: Date;
        period?: "THIS_MONTH" | "LAST_MONTH" | "LAST_3_MONTHS" | "THIS_YEAR" | "ALL_TIME";
      } = {}
): MoneyRunwayAnalysis {
  const options = optionsOrNow instanceof Date ? { now: optionsOrNow } : optionsOrNow;
  const now = options.now || new Date();
  const startingBalance = options.startingBalance || 0;
  const configuredCategoryBudgets = options.categoryBudgets || {};
  const goals = options.goals || [];

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // All-time income & expense for genuine Net Balance
  let totalIncomeAllTime = 0;
  let totalExpenseAllTime = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "INCOME") {
      totalIncomeAllTime += amt;
    } else if (tx.type === "EXPENSE") {
      totalExpenseAllTime += amt;
    }
  }

  const hasRecordedData = transactions.length > 0 || startingBalance > 0 || monthlyBudget > 0;
  const totalBalance = startingBalance + totalIncomeAllTime - totalExpenseAllTime;

  // Filter transactions for current month (or selected period)
  const thisMonthTx = transactions.filter((tx) => {
    const rawDate = tx.dueAt || tx.createdAt;
    const d = new Date(rawDate);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  let totalSpent = 0;
  let totalIncome = 0;
  const categoryMap: Record<string, number> = {};

  for (const tx of thisMonthTx) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "EXPENSE") {
      totalSpent += amt;
      const cat = tx.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    } else if (tx.type === "INCOME") {
      totalIncome += amt;
    }
  }

  // Calculate unpaid active recurring obligations
  const activeRecurring = recurring.filter((r) => r.status !== "CANCELLED" && r.status !== "PAUSED");
  const unpaidRecurring = activeRecurring.filter((r) => !r.isPaidThisMonth && (r.dueDay || 1) >= currentDay);
  const upcomingRecurringTotal = unpaidRecurring.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const remainingBudget = monthlyBudget > 0 ? Math.max(0, monthlyBudget - totalSpent) : 0;
  const effectiveDiscretionary = Math.max(0, remainingBudget - upcomingRecurringTotal);
  const dailySafeToSpend = monthlyBudget > 0 ? Math.round(effectiveDiscretionary / daysRemaining) : 0;

  const daysElapsed = Math.max(1, currentDay);
  const burnRatePerDay = Math.round((totalSpent / daysElapsed) * 10) / 10;
  const runwayDays = burnRatePerDay > 0
    ? Math.round((remainingBudget / burnRatePerDay) * 10) / 10
    : daysRemaining;

  // Budget Health Indicator
  let budgetHealth: MoneyRunwayAnalysis["budgetHealth"] = "healthy";
  let driftAlert: string | undefined;

  if (monthlyBudget > 0) {
    const expectedSpendPace = (monthlyBudget / totalDaysInMonth) * daysElapsed;
    if (totalSpent > monthlyBudget) {
      budgetHealth = "critical";
      driftAlert = `Budget Exceeded: Spent ₹${Math.round(totalSpent)} (over ₹${monthlyBudget} budget by ₹${Math.round(totalSpent - monthlyBudget)}).`;
    } else if (totalSpent > expectedSpendPace * 1.25) {
      budgetHealth = "critical";
      driftAlert = `High Burn: Spent ₹${Math.round(totalSpent)} in ${daysElapsed} days (expected ~₹${Math.round(expectedSpendPace)}). Daily safe cap is ₹${dailySafeToSpend}.`;
    } else if (totalSpent > expectedSpendPace * 1.1) {
      budgetHealth = "cautious";
      driftAlert = `Slight Drift: Expenses trending higher than ideal daily pace.`;
    }
  }

  // Category Breakdown
  const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
  }));
  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  // Category Budgets Tracking & Warnings
  const categoryBudgets: CategoryBudgetStatus[] = Object.entries(configuredCategoryBudgets)
    .filter(([_, budget]) => Number(budget) > 0)
    .map(([category, budgetAmount]) => {
      const budget = Number(budgetAmount);
      const spent = categoryMap[category] || 0;
      const remaining = Math.max(0, budget - spent);
      const percentage = Math.round((spent / budget) * 100);

      let status: "ok" | "warning" | "exceeded" = "ok";
      if (spent >= budget) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        category,
        budget,
        spent: Math.round(spent),
        remaining: Math.round(remaining),
        percentage,
        status,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
      };
    });

  // Savings Goals Summary
  const savingsGoals: SavingsGoalProgress[] = goals.map((g) => {
    const target = Number(g.targetValue) || 1;
    const current = Number(g.currentValue) || 0;
    const percentage = Math.min(100, Math.round((current / target) * 100));
    return {
      id: g.id,
      title: g.title,
      targetValue: target,
      currentValue: current,
      percentage,
      remaining: Math.max(0, target - current),
      color: g.color || "#38BDF8",
      deadline: g.deadline || null,
    };
  });

  const totalSavedAcrossGoals = savingsGoals.reduce((sum, g) => sum + g.currentValue, 0);

  return {
    startingBalance,
    totalBalance: Math.round(totalBalance),
    hasRecordedData,

    monthlyBudget: Math.round(monthlyBudget),
    totalSpentThisMonth: Math.round(totalSpent),
    totalIncomeThisMonth: Math.round(totalIncome),
    remainingBudget: Math.round(remainingBudget),
    daysRemainingInMonth: daysRemaining,
    dailySafeToSpend,
    runwayDays,
    burnRatePerDay,
    budgetHealth,

    categoryBreakdown,
    categoryBudgets,

    recurringCommitments: recurring,
    upcomingRecurringTotal,

    savingsGoals,
    totalSavedAcrossGoals: Math.round(totalSavedAcrossGoals),

    driftAlert,
  };
}
