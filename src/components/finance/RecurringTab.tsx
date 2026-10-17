"use client";

import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Edit2,
  X,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from "@/lib/engine/money";

interface RecurringTabProps {
  recurringSpends: any[];
  onRefresh: () => void;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurringSpends = [],
  onRefresh,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpend, setEditingSpend] = useState<any | null>(null);
  const [recordingPaidSpend, setRecordingPaidSpend] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Form states for Add/Edit
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [category, setCategory] = useState("Housing");
  const [frequency, setFrequency] = useState<"MONTHLY" | "WEEKLY" | "YEARLY">("MONTHLY");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "CANCELLED">("ACTIVE");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  // Open Edit Modal
  const handleOpenEdit = (spend: any) => {
    setEditingSpend(spend);
    setName(spend.name || "");
    setAmount(spend.amount ? String(spend.amount) : "");
    setDayOfMonth(spend.dayOfMonth ? String(spend.dayOfMonth) : "1");
    setCategory(spend.category || "Housing");
    setFrequency(spend.frequency || "MONTHLY");
    setStatus(spend.status || "ACTIVE");
    setNotes(spend.notes || "");
  };

  // Submit Add or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setLoading(true);

    try {
      if (editingSpend) {
        await fetch("/api/money/recurring", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSpend.id,
            name: name.trim(),
            amount: parseFloat(amount),
            dayOfMonth: parseInt(dayOfMonth) || 1,
            category,
            frequency,
            status,
            notes: notes.trim() || null,
          }),
        });
      } else {
        await fetch("/api/money/recurring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            amount: parseFloat(amount),
            dayOfMonth: parseInt(dayOfMonth) || 1,
            category,
            frequency,
            status,
            notes: notes.trim() || null,
          }),
        });
      }

      setIsAddModalOpen(false);
      setEditingSpend(null);
      setName("");
      setAmount("");
      setNotes("");
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Record as Paid action
  const handleRecordPaid = async () => {
    if (!recordingPaidSpend) return;
    setLoading(true);
    try {
      await fetch("/api/money/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: recordingPaidSpend.id,
          action: "RECORD_PAID",
          paymentMethod,
        }),
      });

      setRecordingPaidSpend(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring commitment?")) return;
    try {
      await fetch(`/api/money/recurring?id=${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (spend: any) => {
    const nextStatus = spend.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await fetch("/api/money/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: spend.id, status: nextStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const activeSpends = recurringSpends.filter((r) => r.status === "ACTIVE");
  const totalMonthlyCommitment = activeSpends.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const paidCount = recurringSpends.filter((r) => r.isPaid).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Monthly Commitments</span>
          <p className="font-mono text-2xl font-bold text-white">
            ₹{totalMonthlyCommitment.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] font-mono text-slate-400">
            Across {activeSpends.length} active scheduled subscriptions & bills
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Active Subscriptions</span>
          <p className="font-mono text-2xl font-bold text-desk-amber">
            {activeSpends.length}
          </p>
          <p className="text-[10px] font-mono text-slate-400">
            {recurringSpends.filter((r) => r.status === "PAUSED").length} paused commitments
          </p>
        </GlassCard>

        <GlassCard className="p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Settled This Month</span>
          <p className="font-mono text-2xl font-bold text-emerald-400">
            {paidCount} / {recurringSpends.length}
          </p>
          <p className="text-[10px] font-mono text-slate-400">
            Recorded as confirmed expense payments
          </p>
        </GlassCard>
      </div>

      {/* Main Recurring List */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-desk-amber/15 text-desk-amber border border-desk-amber/30">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">Recurring Commitments</h3>
              <p className="text-xs text-slate-400 font-mono">
                Rent, subscriptions, internet, gym, and EMI commitments
              </p>
            </div>
          </div>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => {
              setEditingSpend(null);
              setName("");
              setAmount("");
              setDayOfMonth("1");
              setNotes("");
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Commitment</span>
          </GlassButton>
        </div>

        {recurringSpends.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3">
            <Receipt className="h-8 w-8 text-slate-500 mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-sm font-serif font-medium text-white">No recurring payments scheduled</p>
              <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                Keep tabs on fixed monthly outgoings such as rent, Netflix, Spotify, gym, and Wi-Fi. We remind you before due dates without unauthorized automatic deductions.
              </p>
            </div>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Schedule First Recurring Spend
            </GlassButton>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {recurringSpends.map((spend) => {
              const isActive = spend.status === "ACTIVE";
              const isPaused = spend.status === "PAUSED";
              const nextDueStr = spend.nextDueDate
                ? new Date(spend.nextDueDate).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })
                : `Day ${spend.dayOfMonth} of month`;

              return (
                <div
                  key={spend.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(spend)}
                      title={isActive ? "Pause commitment" : "Activate commitment"}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                        isActive
                          ? "bg-desk-teal/15 text-desk-teal border-desk-teal/30 hover:bg-desk-teal/25"
                          : "bg-white/[0.05] text-slate-400 border-white/[0.1] hover:text-white"
                      }`}
                    >
                      {isActive ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{spend.name}</span>
                        <Badge
                          variant={isActive ? "teal" : isPaused ? "amber" : "outline"}
                          size="sm"
                        >
                          {spend.status}
                        </Badge>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                          {spend.frequency || "MONTHLY"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span>{spend.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="h-3 w-3 text-desk-amber" />
                          Next due: {nextDueStr}
                        </span>
                        {spend.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-xs">{spend.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-mono text-base font-bold text-white tabular-nums">
                      ₹{Number(spend.amount).toLocaleString("en-IN")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {spend.isPaid ? (
                        <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setRecordingPaidSpend(spend)}
                          className="px-2.5 py-1 rounded-xl bg-desk-amber/20 hover:bg-desk-amber/30 text-desk-amber border border-desk-amber/40 text-xs font-mono font-semibold transition-colors"
                        >
                          Record Paid
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(spend)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Edit commitment"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(spend.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete commitment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Modal: Add or Edit Commitment */}
      {(isAddModalOpen || editingSpend) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-serif text-base font-semibold text-white">
                {editingSpend ? "Edit Commitment" : "New Recurring Commitment"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSpend(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Commitment Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apartment Rent, Spotify Premium, Cult.fit"
                  required
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5500"
                    required
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Due Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                  >
                    {DEFAULT_CATEGORIES.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                >
                  <option value="ACTIVE">Active (Remind on schedule)</option>
                  <option value="PAUSED">Paused (Temporarily on hold)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Landlord UPI ID, renewal date"
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSpend(null);
                  }}
                >
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingSpend ? "Update Commitment" : "Schedule Commitment"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Record as Paid */}
      {recordingPaidSpend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-serif text-base font-semibold text-white">Record as Paid</h3>
              <button onClick={() => setRecordingPaidSpend(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-mono text-slate-300">
                Confirm payment of <strong className="text-white font-bold">₹{recordingPaidSpend.amount}</strong> for <span className="text-desk-amber font-semibold">{recordingPaidSpend.name}</span>.
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                This will record a real expense in your transaction ledger and advance the next due date by 1 {recordingPaidSpend.frequency?.toLowerCase() || "month"}.
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-2xl bg-[#090D16] px-3.5 py-2 text-xs text-white border border-white/[0.12] focus:outline-none"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setRecordingPaidSpend(null)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" onClick={handleRecordPaid} disabled={loading}>
                  {loading ? "Recording..." : "Confirm Payment"}
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
