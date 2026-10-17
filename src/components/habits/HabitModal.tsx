"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Flame,
  Shield,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  Check,
} from "lucide-react";
import { HabitFrequencyType, HabitStatus } from "@/lib/engine/habits";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  habitToEdit?: any;
}

const CATEGORIES = [
  "Health & Fitness",
  "Productivity",
  "Mind & Wellness",
  "Learning & Skills",
  "Personal",
  "Career",
  "Finance",
];

const DAYS_OF_WEEK = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

const HABIT_COLORS = [
  "#E0A458", // Desk Amber
  "#1F6F6B", // Desk Teal
  "#38BDF8", // Sky
  "#34D399", // Emerald
  "#A78BFA", // Violet
  "#F472B6", // Pink
  "#FB923C", // Orange
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  habitToEdit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Health & Fitness");
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>("DAILY");
  const [targetDaysOfWeek, setTargetDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [frequencyDays, setFrequencyDays] = useState(5);
  const [dailyTarget, setDailyTarget] = useState("1");
  const [reminderTime, setReminderTime] = useState("07:30");
  const [monthlyGraceMax, setMonthlyGraceMax] = useState(2);
  const [color, setColor] = useState("#E0A458");
  const [status, setStatus] = useState<HabitStatus>("ACTIVE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.habitName || habitToEdit.name || "");
      setDescription(habitToEdit.description || "");
      setCategory(habitToEdit.category || "Health & Fitness");
      setFrequencyType(habitToEdit.frequencyType || "DAILY");
      setTargetDaysOfWeek(
        Array.isArray(habitToEdit.targetDaysOfWeek)
          ? habitToEdit.targetDaysOfWeek
          : [1, 2, 3, 4, 5]
      );
      setFrequencyDays(habitToEdit.frequencyDays || 5);
      setDailyTarget(String(habitToEdit.dailyTarget || 1));
      setReminderTime(habitToEdit.reminderTime || "07:30");
      setMonthlyGraceMax(habitToEdit.monthlyGraceMax ?? 2);
      setColor(habitToEdit.color || "#E0A458");
      setStatus(habitToEdit.status || "ACTIVE");
    } else {
      setName("");
      setDescription("");
      setCategory("Health & Fitness");
      setFrequencyType("DAILY");
      setTargetDaysOfWeek([1, 2, 3, 4, 5]);
      setFrequencyDays(5);
      setDailyTarget("1");
      setReminderTime("07:30");
      setMonthlyGraceMax(2);
      setColor("#E0A458");
      setStatus("ACTIVE");
    }
    setError(null);
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDayOfWeek = (day: number) => {
    setTargetDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Habit name is required.");
      return;
    }

    if (frequencyType === "SELECTED_DAYS" && targetDaysOfWeek.length === 0) {
      setError("Please select at least one day of the week.");
      return;
    }

    setLoading(true);
    setError(null);

    const freqDays =
      frequencyType === "DAILY"
        ? 7
        : frequencyType === "SELECTED_DAYS"
        ? targetDaysOfWeek.length
        : frequencyDays;

    try {
      if (habitToEdit) {
        const habitId = habitToEdit.habitId || habitToEdit.id;
        const res = await fetch("/api/habits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: habitId,
            name: name.trim(),
            description: description.trim(),
            category,
            frequencyType,
            frequencyDays: freqDays,
            targetDaysOfWeek,
            dailyTarget: parseInt(dailyTarget) || 1,
            reminderTime: reminderTime || null,
            monthlyGraceMax,
            color,
            status,
          }),
        });
        if (!res.ok) throw new Error("Failed to update habit");
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CREATE",
            name: name.trim(),
            description: description.trim(),
            category,
            frequencyType,
            frequencyDays: freqDays,
            targetDaysOfWeek,
            dailyTarget: parseInt(dailyTarget) || 1,
            reminderTime: reminderTime || null,
            monthlyGraceMax,
            color,
          }),
        });
        if (!res.ok) throw new Error("Failed to create habit");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md overflow-y-auto">
      <GlassCard
        variant="hero"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 border-white/[0.12] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orbit-amber/20 text-orbit-amber border border-orbit-amber/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">
                {habitToEdit ? "Edit Atomic Habit" : "Create New Habit"}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Daily rituals with built-in grace protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 20-min Morning Deep Focus, Hydrate 3L, Strength Workout"
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-amber focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Cue & Intention (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Immediately after making morning coffee"
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-amber focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-white border border-white/[0.1] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              Frequency Schedule
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "DAILY", label: "Every Day", desc: "7 days a week" },
                { type: "SELECTED_DAYS", label: "Selected Days", desc: "e.g. Mon-Fri" },
                { type: "WEEKLY_TARGET", label: "Weekly Target", desc: "X days / week" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setFrequencyType(opt.type as HabitFrequencyType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    frequencyType === opt.type
                      ? "bg-orbit-amber/15 border-orbit-amber/60 text-white"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] font-mono opacity-80">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Days Picker */}
          {frequencyType === "SELECTED_DAYS" && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-300 block">
                Active Days of the Week:
              </span>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map((item) => {
                  const isSelected = targetDaysOfWeek.includes(item.day);
                  return (
                    <button
                      key={item.day}
                      type="button"
                      onClick={() => toggleDayOfWeek(item.day)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        isSelected
                          ? "bg-orbit-amber text-canvas-950 font-bold border-orbit-amber"
                          : "bg-white/[0.05] text-slate-400 border-white/[0.1] hover:bg-white/[0.1]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Target Number */}
          {frequencyType === "WEEKLY_TARGET" && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">
                Target Days Per Week:
              </span>
              <div className="flex items-center gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFrequencyDays(num)}
                    className={`h-7 w-7 rounded-lg text-xs font-mono border transition-all ${
                      frequencyDays === num
                        ? "bg-orbit-amber text-canvas-950 font-bold border-orbit-amber"
                        : "bg-white/[0.05] text-slate-400 border-white/[0.1]"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Time & Monthly Grace Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-orbit-amber" />
                <span>Preferred Reminder</span>
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white border border-white/[0.1] focus:border-orbit-amber focus:outline-none [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-orbit-amber" />
                <span>Grace Days / Month</span>
              </label>
              <select
                value={monthlyGraceMax}
                onChange={(e) => setMonthlyGraceMax(parseInt(e.target.value))}
                className="w-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-white border border-white/[0.1] focus:outline-none"
              >
                <option value={0}>0 (Strict)</option>
                <option value={1}>1 day / month</option>
                <option value={2}>2 days / month (Recommended)</option>
                <option value={3}>3 days / month</option>
              </select>
            </div>
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
              Habit Accent Color
            </label>
            <div className="flex items-center gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full border transition-all flex items-center justify-center ${
                    color === c ? "ring-2 ring-white scale-110 border-white" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {color === c && <Check className="h-3.5 w-3.5 text-canvas-950 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <GlassButton variant="ghost" size="md" onClick={onClose} type="button">
              Cancel
            </GlassButton>
            <GlassButton
              variant="accent"
              size="md"
              type="submit"
              isLoading={loading}
              className="px-6"
            >
              {habitToEdit ? "Save Changes" : "Start Tracking"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
