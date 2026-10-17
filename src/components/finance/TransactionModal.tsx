"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  Receipt,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Target,
  Repeat,
} from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from "@/lib/engine/money";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  transactionToEdit?: any | null;
  goals?: any[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  transactionToEdit,
  goals = [],
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(transactionToEdit);

  const [type, setType] = useState<"EXPENSE" | "INCOME">(
    transactionToEdit?.type === "INCOME" ? "INCOME" : "EXPENSE"
  );
  const [title, setTitle] = useState(transactionToEdit?.title || "");
  const [amount, setAmount] = useState<string>(
    transactionToEdit?.amount ? String(transactionToEdit.amount) : ""
  );
  const [category, setCategory] = useState(
    transactionToEdit?.category || (type === "INCOME" ? "Salary" : "Food")
  );
  const [isCustomCategory, setIsCustomCategory] = useState(
    transactionToEdit?.category && !DEFAULT_CATEGORIES.includes(transactionToEdit.category)
  );
  const [customCatName, setCustomCatName] = useState(
    isCustomCategory ? transactionToEdit?.category : ""
  );
  const [subcategory, setSubcategory] = useState(
    transactionToEdit?.metadata?.subcategory || transactionToEdit?.subcategory || ""
  );
  const [date, setDate] = useState(
    transactionToEdit?.dueAt
      ? new Date(transactionToEdit.dueAt).toISOString().split("T")[0]
      : transactionToEdit?.createdAt
      ? new Date(transactionToEdit.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(
    transactionToEdit?.metadata?.paymentMethod || "UPI"
  );
  const [notes, setNotes] = useState(
    transactionToEdit?.description || transactionToEdit?.metadata?.description || ""
  );
  const [isRecurring, setIsRecurring] = useState(
    Boolean(transactionToEdit?.isRecurring || transactionToEdit?.metadata?.isRecurring)
  );
  const [recurringFrequency, setRecurringFrequency] = useState(
    transactionToEdit?.recurringFrequency || "MONTHLY"
  );
  const [linkedGoalId, setLinkedGoalId] = useState(
    transactionToEdit?.goalId || transactionToEdit?.metadata?.linkedGoalId || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type === "INCOME" ? "INCOME" : "EXPENSE");
      setTitle(transactionToEdit.title || "");
      setAmount(transactionToEdit.amount ? String(transactionToEdit.amount) : "");
      const isCustom = transactionToEdit.category && !DEFAULT_CATEGORIES.includes(transactionToEdit.category);
      setIsCustomCategory(isCustom);
      setCategory(transactionToEdit.category || "Food");
      setCustomCatName(isCustom ? transactionToEdit.category : "");
      setSubcategory(transactionToEdit.metadata?.subcategory || "");
      setDate(
        transactionToEdit.dueAt
          ? new Date(transactionToEdit.dueAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setPaymentMethod(transactionToEdit.metadata?.paymentMethod || "UPI");
      setNotes(transactionToEdit.description || transactionToEdit.metadata?.description || "");
      setIsRecurring(Boolean(transactionToEdit.isRecurring || transactionToEdit.metadata?.isRecurring));
      setRecurringFrequency(transactionToEdit.recurringFrequency || "MONTHLY");
      setLinkedGoalId(transactionToEdit.goalId || transactionToEdit.metadata?.linkedGoalId || "");
    }
  }, [transactionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError("Please provide a title or description for this record.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    const finalCategory = isCustomCategory ? (customCatName.trim() || "Other") : category;

    setLoading(true);

    try {
      if (isEditing) {
        const res = await fetch("/api/money", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: transactionToEdit.id,
            title: title.trim(),
            amount: parsedAmount,
            type,
            category: finalCategory,
            subcategory: subcategory.trim() || null,
            date: new Date(date).toISOString(),
            paymentMethod,
            notes: notes.trim() || null,
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : "NONE",
            linkedGoalId: linkedGoalId || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update transaction");
        }
      } else {
        const res = await fetch("/api/money", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            amount: parsedAmount,
            type,
            category: finalCategory,
            subcategory: subcategory.trim() || null,
            date: new Date(date).toISOString(),
            paymentMethod,
            notes: notes.trim() || null,
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : "NONE",
            linkedGoalId: linkedGoalId || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create transaction");
        }
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/money?id=${transactionToEdit.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete transaction");
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not delete transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#090D16]/95 border border-white/[0.14] shadow-2xl p-6 text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                type === "INCOME"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-400 border-rose-500/30"
              }`}
            >
              {type === "INCOME" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">
                {isEditing ? "Edit Financial Transaction" : "Record Transaction"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isEditing ? "Modify or remove persisted entry" : "Track real income or expense"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setType("EXPENSE");
                if (category === "Salary" || category === "Freelance Income") setCategory("Food");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                type === "EXPENSE"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("INCOME");
                if (category === "Food") setCategory("Salary");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                type === "INCOME"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full rounded-2xl bg-white/[0.05] pl-8 pr-3.5 py-2.5 text-base font-mono font-bold text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Description / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === "EXPENSE" ? "e.g. Swiggy Lunch, Metro Pass" : "e.g. Monthly Salary, Stipend"}
                required
                className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              />
            </div>
          </div>

          {/* Category & Custom Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono text-slate-400">Category *</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] font-mono text-desk-amber hover:underline"
              >
                {isCustomCategory ? "Choose standard category" : "+ Custom category"}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                placeholder="Enter custom category name (e.g. Gym, Pet Care)"
                className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2.5 text-sm text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              >
                {DEFAULT_CATEGORIES.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subcategory & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Subcategory (Optional)
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Groceries, Dinner, Fuel"
                className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2.5 text-sm text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.05] pl-10 pr-3.5 py-2.5 text-sm text-white font-mono border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
              />
            </div>
          </div>

          {/* Link to Financial Goal (Optional) */}
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Linked Financial Goal (Optional)
              </label>
              <div className="relative">
                <Target className="absolute left-3.5 top-3 h-4 w-4 text-desk-teal" />
                <select
                  value={linkedGoalId}
                  onChange={(e) => setLinkedGoalId(e.target.value)}
                  className="w-full rounded-2xl bg-[#090D16] pl-10 pr-3.5 py-2.5 text-sm text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
                >
                  <option value="">None (General Transaction)</option>
                  {goals.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.title} (Target: ₹{g.targetValue?.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Recurring Schedule Option */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-desk-amber" />
                <span className="text-xs font-medium text-white">Repeat this transaction?</span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded accent-desk-amber"
              />
            </div>

            {isRecurring && (
              <div className="pt-2">
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Recurring Frequency
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className="w-full rounded-xl bg-[#090D16] px-3 py-2 text-xs text-white border border-white/[0.12] focus:outline-none"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes / Details */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add receipt notes, payment reference ID, etc."
              className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/40"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
          {isEditing ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-300 font-mono">Confirm delete?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="accent"
              size="sm"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Record Transaction"}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};
