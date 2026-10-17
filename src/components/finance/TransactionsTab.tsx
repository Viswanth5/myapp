"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  TrendingDown,
  TrendingUp,
  Receipt,
  Calendar,
  CreditCard,
  Target,
  Repeat,
  Edit2,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from "@/lib/engine/money";

interface TransactionsTabProps {
  transactions: any[];
  goals: any[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: any) => void;
  onRefresh: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  goals = [],
  onOpenAddModal,
  onEditTransaction,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "EXPENSE" | "INCOME">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = tx.title?.toLowerCase().includes(q);
          const matchCat = tx.category?.toLowerCase().includes(q);
          const matchSubcat = tx.metadata?.subcategory?.toLowerCase().includes(q);
          const matchNotes = tx.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchCat && !matchSubcat && !matchNotes) return false;
        }

        // Type filter
        if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== "ALL" && tx.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.dueAt || b.createdAt || 0).getTime();
        const amtA = Number(a.amount) || 0;
        const amtB = Number(b.amount) || 0;

        if (sortBy === "date-desc") return dateB - dateA;
        if (sortBy === "date-asc") return dateA - dateB;
        if (sortBy === "amount-desc") return amtB - amtA;
        if (sortBy === "amount-asc") return amtA - amtB;
        return 0;
      });
  }, [transactions, search, typeFilter, categoryFilter, sortBy]);

  // Unique categories in transactions
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set);
  }, [transactions]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/money?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions by title, category, or notes..."
            className="w-full rounded-2xl bg-white/[0.05] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-desk-amber/30"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <GlassButton variant="accent" size="sm" onClick={onOpenAddModal}>
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Transaction</span>
          </GlassButton>
        </div>
      </div>

      {/* Pill Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        {/* Type Filter */}
        <div className="flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              typeFilter === "ALL" ? "bg-white/[0.12] text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("EXPENSE")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              typeFilter === "EXPENSE" ? "bg-rose-500/20 text-rose-300 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setTypeFilter("INCOME")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              typeFilter === "INCOME" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Income
          </button>
        </div>

        {/* Category Filter */}
        {uniqueCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-[#090D16] px-3 py-1.5 text-xs text-slate-300 border border-white/[0.1] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-xl bg-[#090D16] px-3 py-1.5 text-xs text-slate-300 border border-white/[0.1] focus:outline-none ml-auto"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Transaction List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-desk-amber" />
            <h3 className="font-serif text-base font-medium text-white">Transaction Ledger</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredTransactions.length} of {transactions.length} records
          </span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-slate-500">
                <Receipt className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-serif font-medium text-white">No transactions found</p>
                <p className="text-xs font-mono text-slate-400">
                  {transactions.length === 0
                    ? "Start tracking your financial transactions to unlock cash flow analytics."
                    : "Try adjusting your search query or category filters."}
                </p>
              </div>
              {transactions.length === 0 && (
                <GlassButton variant="accent" size="sm" onClick={onOpenAddModal}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Record First Transaction</span>
                </GlassButton>
              )}
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isExpense = tx.type === "EXPENSE";
              const catColor = CATEGORY_COLORS[tx.category] || "#94A3B8";
              const formattedDate = new Date(tx.dueAt || tx.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                        isExpense
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {isExpense ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-md">
                          {tx.title}
                        </p>
                        {tx.isRecurring && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
                            <Repeat className="h-2.5 w-2.5" />
                            <span>Recurring</span>
                          </span>
                        )}
                        {tx.goalId && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-desk-teal/15 text-desk-teal border border-desk-teal/30">
                            <Target className="h-2.5 w-2.5" />
                            <span>Goal</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: catColor }}
                          />
                          {tx.category || "General"}
                        </span>
                        {tx.metadata?.subcategory && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{tx.metadata.subcategory}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formattedDate}</span>
                        {tx.metadata?.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{tx.metadata.paymentMethod}</span>
                          </>
                        )}
                      </div>

                      {tx.description && (
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span
                      className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
                        isExpense ? "text-slate-200" : "text-emerald-400"
                      }`}
                    >
                      {isExpense ? `-₹${Number(tx.amount).toLocaleString("en-IN")}` : `+₹${Number(tx.amount).toLocaleString("en-IN")}`}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {deletingId === tx.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="px-2 py-1 rounded bg-rose-600 text-[10px] font-bold text-white hover:bg-rose-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
};
