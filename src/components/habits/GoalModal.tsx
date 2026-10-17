"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Target,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  GOAL_CATEGORIES,
  GOAL_PRIORITIES,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalTrackingType,
} from "@/lib/engine/goals";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  goalToEdit?: any;
}

interface MilestoneInputItem {
  id?: string;
  title: string;
  completed?: boolean;
  createLinkedTask?: boolean;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  goalToEdit,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Personal");
  const [priority, setPriority] = useState<GoalPriority>("MEDIUM");
  const [status, setStatus] = useState<GoalStatus>("IN_PROGRESS");
  const [trackingType, setTrackingType] = useState<GoalTrackingType>("MILESTONE");
  const [targetDate, setTargetDate] = useState("");
  const [targetValue, setTargetValue] = useState("100");
  const [unit, setUnit] = useState("%");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState("#38BDF8");

  // Milestones
  const [milestones, setMilestones] = useState<MilestoneInputItem[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneTaskLink, setNewMilestoneTaskLink] = useState(false);

  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || "");
      setDescription(goalToEdit.description || "");
      setCategory(goalToEdit.category || "Personal");
      setPriority(goalToEdit.priority || "MEDIUM");
      setStatus(goalToEdit.status || "IN_PROGRESS");
      setTrackingType(goalToEdit.trackingType || "MILESTONE");
      setTargetDate(
        goalToEdit.deadline
          ? new Date(goalToEdit.deadline).toISOString().split("T")[0]
          : ""
      );
      setTargetValue(String(goalToEdit.targetValue || 100));
      setUnit(goalToEdit.unit || "%");
      setNotes(goalToEdit.notes || "");
      setColor(goalToEdit.color || "#38BDF8");
      setMilestones(
        Array.isArray(goalToEdit.milestones)
          ? goalToEdit.milestones.map((m: any) => ({
              id: m.id,
              title: m.title,
              completed: Boolean(m.completed),
              createLinkedTask: false,
            }))
          : []
      );
    } else {
      setTitle("");
      setDescription("");
      setCategory("Personal");
      setPriority("MEDIUM");
      setStatus("IN_PROGRESS");
      setTrackingType("MILESTONE");
      setTargetDate("");
      setTargetValue("100");
      setUnit("%");
      setNotes("");
      setColor("#38BDF8");
      setMilestones([]);
    }
    setError(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([
      ...milestones,
      {
        id: `m-temp-${Date.now()}`,
        title: newMilestoneTitle.trim(),
        completed: false,
        createLinkedTask: newMilestoneTaskLink,
      },
    ]);
    setNewMilestoneTitle("");
    setNewMilestoneTaskLink(false);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSuggestSteps = async () => {
    if (!title.trim()) {
      setError("Please enter a goal title first to generate suggestions.");
      return;
    }
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUGGEST_MILESTONES",
          title: title.trim(),
          category,
        }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const generated = data.suggestions.map((sTitle: string, idx: number) => ({
          id: `m-sug-${Date.now()}-${idx}`,
          title: sTitle,
          completed: false,
          createLinkedTask: false,
        }));
        setMilestones([...milestones, ...generated]);
      }
    } catch {
      setError("Could not generate suggestions right now.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Goal title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (goalToEdit) {
        const res = await fetch("/api/goals", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: goalToEdit.id,
            title: title.trim(),
            description: description.trim(),
            category,
            priority,
            status,
            trackingType,
            targetDate: targetDate || null,
            targetValue: parseFloat(targetValue) || 100,
            unit,
            notes: notes.trim(),
            color,
            milestones: milestones.map((m, idx) => ({
              id: m.id,
              title: m.title,
              completed: Boolean(m.completed),
              order: idx,
            })),
          }),
        });
        if (!res.ok) throw new Error("Failed to update goal");
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            priority,
            status,
            trackingType,
            targetDate: targetDate || null,
            targetValue: parseFloat(targetValue) || 100,
            unit,
            notes: notes.trim(),
            color,
            milestones,
          }),
        });
        if (!res.ok) throw new Error("Failed to create goal");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md overflow-y-auto">
      <GlassCard
        variant="hero"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 border-white/[0.12] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orbit-cyan/20 text-orbit-cyan border border-orbit-cyan/30">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-white">
                {goalToEdit ? "Edit Goal & Milestones" : "Create New Goal"}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Break large visions into structured, actionable achievements
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
          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master React 19 & Next.js App Router"
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-cyan focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters and what success looks like..."
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-white border border-white/[0.1] focus:outline-none"
              >
                {GOAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-white border border-white/[0.1] focus:outline-none"
              >
                {GOAL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Target Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white border border-white/[0.1] focus:border-orbit-cyan focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full rounded-xl bg-[#0f172a] px-3 py-2 text-xs text-white border border-white/[0.1] focus:outline-none"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Tracking Method Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              Tracking Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "MILESTONE", label: "Milestones", desc: "Step by step" },
                { type: "TASK", label: "Linked Tasks", desc: "Desk tasks sync" },
                { type: "NUMERIC", label: "Numeric Target", desc: "Value or currency" },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setTrackingType(opt.type as GoalTrackingType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    trackingType === opt.type
                      ? "bg-orbit-cyan/15 border-orbit-cyan/60 text-white"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] font-mono opacity-80">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Numeric Target Inputs if NUMERIC */}
          {trackingType === "NUMERIC" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-white border border-white/[0.1] focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Unit Label
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="INR, %, chapters, km"
                  className="w-full rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-white border border-white/[0.1] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Milestones Breakdown Section */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-orbit-cyan" />
                <span>Milestones & Action Steps ({milestones.length})</span>
              </span>

              <button
                type="button"
                onClick={handleSuggestSteps}
                disabled={suggesting}
                className="flex items-center gap-1 text-[11px] font-mono text-orbit-cyan hover:underline cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>{suggesting ? "Generating..." : "Suggest Steps"}</span>
              </button>
            </div>

            {/* List of existing/added milestones */}
            {milestones.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 w-4">
                        {idx + 1}.
                      </span>
                      <span
                        className={
                          m.completed ? "line-through text-slate-500" : "text-slate-200"
                        }
                      >
                        {m.title}
                      </span>
                      {m.createLinkedTask && (
                        <Badge variant="teal" size="sm">
                          + Desk Task
                        </Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add a new milestone */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                  placeholder="Add actionable milestone..."
                  className="flex-1 rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3.5 py-2 rounded-xl bg-orbit-cyan/20 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono hover:bg-orbit-cyan/30 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {!goalToEdit && (
                <label className="flex items-center gap-2 text-[11px] font-mono text-slate-400 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={newMilestoneTaskLink}
                    onChange={(e) => setNewMilestoneTaskLink(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-orbit-cyan focus:ring-0"
                  />
                  <span>Also create linked task in Today Desk for this milestone</span>
                </label>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Personal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Milestone reflections, resources, or reminders..."
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:outline-none resize-none"
            />
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
              {goalToEdit ? "Save Changes" : "Create Goal"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
