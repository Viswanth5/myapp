"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Receipt,
  Target,
  Repeat,
  Bike,
  BarChart3,
  Plus,
  IndianRupee,
  Sparkles,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { useOrbitStore } from "@/store/useOrbitStore";

// Sub-components
import { FinanceOverviewTab } from "@/components/finance/FinanceOverviewTab";
import { TransactionsTab } from "@/components/finance/TransactionsTab";
import { BudgetsSavingsTab } from "@/components/finance/BudgetsSavingsTab";
import { RecurringTab } from "@/components/finance/RecurringTab";
import { BikeTravelTab } from "@/components/finance/BikeTravelTab";
import { FinanceChartsTab } from "@/components/finance/FinanceChartsTab";
import { TransactionModal } from "@/components/finance/TransactionModal";

type TabKey = "overview" | "transactions" | "budgets" | "recurring" | "bike" | "charts";

export const MoneyView: React.FC = () => {
  const { refreshCounter, triggerRefresh } = useOrbitStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Modals
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  // 1. Fetch Finance Data
  const { data: moneyData, refetch: refetchMoney, isLoading: isMoneyLoading } = useQuery({
    queryKey: ["money-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/money");
      if (!res.ok) throw new Error("Failed to fetch money data");
      return res.json();
    },
  });

  // 2. Fetch Bike Data
  const { data: bikeData, refetch: refetchBike } = useQuery({
    queryKey: ["bike-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/money/bike");
      if (!res.ok) return { logs: [], analytics: null };
      return res.json();
    },
  });

  const handleRefreshAll = () => {
    refetchMoney();
    refetchBike();
    triggerRefresh();
  };

  const analysis = moneyData?.analysis;
  const user = moneyData?.user;
  const transactions = moneyData?.transactions || [];
  const recurringSpends = moneyData?.recurringSpends || [];
  const goals = moneyData?.goals || [];
  const bikeLogs = bikeData?.logs || [];
  const bikeAnalytics = bikeData?.analytics;

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "transactions", label: "Transactions", icon: Receipt },
    { key: "budgets", label: "Budgets & Savings", icon: Target },
    { key: "recurring", label: "Recurring", icon: Repeat },
    { key: "bike", label: "Bike & Travel", icon: Bike },
    { key: "charts", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Financial Management & Runway
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Personal cash flow, category budgets, savings goals, recurring bills & bike mileage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Record Transaction</span>
          </GlassButton>
        </div>
      </div>

      {/* Modern Sub-Tab Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.08]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white/[0.12] text-white font-semibold shadow-sm border border-white/[0.14]"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-desk-amber" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.key === "transactions" && transactions.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-300">
                  {transactions.length}
                </span>
              )}
              {tab.key === "recurring" && recurringSpends.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-slate-300">
                  {recurringSpends.filter((r: any) => r.status === "ACTIVE").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <FinanceOverviewTab
            user={user}
            analysis={analysis}
            transactions={transactions}
            recurringSpends={recurringSpends}
            goals={goals}
            bikeAnalytics={bikeAnalytics}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onOpenAddFuel={() => setActiveTab("bike")}
            onNavigateTab={(k) => setActiveTab(k as TabKey)}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === "transactions" && (
          <TransactionsTab
            transactions={transactions}
            goals={goals}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddTxModalOpen(true);
            }}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === "budgets" && (
          <BudgetsSavingsTab
            user={user}
            analysis={analysis}
            goals={goals}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === "recurring" && (
          <RecurringTab
            recurringSpends={recurringSpends}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === "bike" && (
          <BikeTravelTab
            logs={bikeLogs}
            analytics={bikeAnalytics}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === "charts" && (
          <FinanceChartsTab
            transactions={transactions}
            analysis={analysis}
            bikeAnalytics={bikeAnalytics}
          />
        )}
      </div>

      {/* Transaction Modal (Add or Edit) */}
      <TransactionModal
        isOpen={isAddTxModalOpen || Boolean(editingTransaction)}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onRefresh={handleRefreshAll}
        transactionToEdit={editingTransaction}
        goals={goals}
      />
    </div>
  );
};
