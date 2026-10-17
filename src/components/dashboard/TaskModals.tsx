"use client";

import React, { useState } from "react";
import {
  X,
  Scissors,
  Edit2,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Repeat,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Star,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  STANDARD_TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  RECURRING_FREQUENCIES,
  TaskPriority,
  getCategoryBadgeColor,
} from "@/lib/constants/tasks";

interface UniversalTaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  initialCategory?: string;
}

export const UniversalTaskCreateModal: React.FC<UniversalTaskCreateModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  initialCategory = "Personal",
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCat, setIsCustomCat] = useState(!STANDARD_TASK_CATEGORIES.includes(initialCategory as any));
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [effortMin, setEffortMin] = useState(30);
  const [dueAt, setDueAt] = useState("");
  const [status, setStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("PENDING");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">("NONE");
  const [isFocus, setIsFocus] = useState(false);

  // Subtasks list
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks((prev) => [...prev, newSubtaskInput.trim()]);
    setNewSubtaskInput("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const effectiveCategory = isCustomCat
      ? customCategory.trim() || "Personal"
      : category;

    try {
      const res = await fetch("/api/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: effectiveCategory,
          priority,
          effortMin: Number(effortMin) || 30,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          status,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : "NONE",
          isFocus,
          subtasks,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#0B101D] border border-white/[0.18] p-6 shadow-glass-3 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
          <div className="flex items-center gap-2.5 text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orbit-teal/20 text-orbit-teal border border-orbit-teal/30">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">Create New Task</h3>
              <p className="text-[11px] text-slate-400 font-mono">Organize across your life areas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/[0.08] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              required
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 border border-white/[0.12] focus:border-orbit-amber focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key notes, links, or expectations..."
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder-slate-500 border border-white/[0.12] focus:border-orbit-amber focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-slate-400" />
                <span>Life Area / Category</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCat(!isCustomCat)}
                className="text-[11px] font-mono text-orbit-amber hover:underline cursor-pointer"
              >
                {isCustomCat ? "Select Standard" : "+ Custom Category"}
              </button>
            </div>

            {isCustomCat ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category (e.g. Side Hustle, Music)..."
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs font-mono text-white border border-orbit-amber/40 focus:border-orbit-amber focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {STANDARD_TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority & Effort Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Est. Minutes</span>
              </label>
              <input
                type="number"
                value={effortMin}
                onChange={(e) => setEffortMin(Number(e.target.value))}
                min={5}
                max={480}
                step={5}
                className="w-full rounded-xl bg-white/[0.05] px-3 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              />
            </div>
          </div>

          {/* Due Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Due Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] px-3 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Initial Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-orbit-teal" />
                <span className="text-xs font-mono text-slate-200">Recurring Schedule</span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked && recurringFrequency === "NONE") {
                    setRecurringFrequency("DAILY");
                  }
                }}
                className="rounded accent-orbit-teal cursor-pointer"
              />
            </div>

            {isRecurring && (
              <select
                value={recurringFrequency}
                onChange={(e: any) => setRecurringFrequency(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3 py-1.5 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-teal focus:outline-none"
              >
                <option value="DAILY">Repeats Daily</option>
                <option value="WEEKLY">Repeats Weekly</option>
                <option value="MONTHLY">Repeats Monthly</option>
              </select>
            )}
          </div>

          {/* Focus Toggle */}
          <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-orbit-amber fill-orbit-amber/30" />
              <span className="text-xs font-mono text-slate-200">Set as Today's Focus</span>
            </div>
            <input
              type="checkbox"
              checked={isFocus}
              onChange={(e) => setIsFocus(e.target.checked)}
              className="rounded accent-orbit-amber cursor-pointer"
            />
          </div>

          {/* Subtasks Builder */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <ListTodo className="h-3 w-3 text-slate-400" />
              <span>Subtasks / Steps ({subtasks.length})</span>
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 border border-white/[0.06]"
                  >
                    <span className="truncate">
                      {idx + 1}. {st}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-500 hover:text-rose-300 p-0.5 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask step..."
                className="flex-1 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-30 text-xs font-mono text-white transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <GlassButton
              variant="accent"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              className="px-5 text-xs font-semibold"
            >
              Create Task
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TaskEditModalProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || task.metadata?.description || "");
  const [category, setCategory] = useState(task.category || "Personal");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCat, setIsCustomCat] = useState(!STANDARD_TASK_CATEGORIES.includes(task.category as any));
  const [effortMin, setEffortMin] = useState(task.effortMin || 30);
  const [priority, setPriority] = useState<TaskPriority>(task.priority || task.metadata?.priority || "MEDIUM");
  const [status, setStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">(
    task.status || "PENDING"
  );
  const [dueAt, setDueAt] = useState(
    task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : ""
  );
  const [isRecurring, setIsRecurring] = useState(Boolean(task.isRecurring || task.metadata?.isRecurring));
  const [recurringFrequency, setRecurringFrequency] = useState<"NONE" | "DAILY" | "WEEKLY" | "MONTHLY">(
    task.recurringFrequency || task.metadata?.recurringFrequency || "NONE"
  );

  // Subtasks manager
  const [subtasks, setSubtasks] = useState<any[]>(
    task.subtasks || task.metadata?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (idx: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const effectiveCategory = isCustomCat
      ? customCategory.trim() || "Personal"
      : category;

    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          action: "EDIT",
          title: title.trim(),
          description: description.trim(),
          category: effectiveCategory,
          status,
          effortMin: Number(effortMin),
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : "NONE",
          subtasks,
        }),
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#0B101D] border border-white/[0.18] p-6 shadow-glass-3 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
          <div className="flex items-center gap-2.5 text-white">
            <Edit2 className="h-4 w-4 text-orbit-amber" />
            <div>
              <h3 className="font-serif text-lg font-semibold">Edit Task</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Created: {new Date(task.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                {task.completedAt && ` • Completed: ${new Date(task.completedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2.5 text-sm text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes or instructions..."
              className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-slate-400" />
                <span>Life Area / Category</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCat(!isCustomCat)}
                className="text-[11px] font-mono text-orbit-amber hover:underline cursor-pointer"
              >
                {isCustomCat ? "Select Standard" : "+ Custom"}
              </button>
            </div>

            {isCustomCat ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Custom category name..."
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs font-mono text-white border border-orbit-amber/40 focus:border-orbit-amber focus:outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {STANDARD_TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              >
                {TASK_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Effort & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Est. Effort (mins)</span>
              </label>
              <input
                type="number"
                value={effortMin}
                onChange={(e) => setEffortMin(Number(e.target.value))}
                min={5}
                max={480}
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Due Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] px-3.5 py-2 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-amber focus:outline-none"
              />
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-orbit-teal" />
                <span className="text-xs font-mono text-slate-200">Recurring Schedule</span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked && recurringFrequency === "NONE") {
                    setRecurringFrequency("DAILY");
                  }
                }}
                className="rounded accent-orbit-teal cursor-pointer"
              />
            </div>

            {isRecurring && (
              <select
                value={recurringFrequency}
                onChange={(e: any) => setRecurringFrequency(e.target.value)}
                className="w-full rounded-xl bg-[#070B14] px-3 py-1.5 text-xs font-mono text-white border border-white/[0.12] focus:border-orbit-teal focus:outline-none"
              >
                <option value="DAILY">Repeats Daily</option>
                <option value="WEEKLY">Repeats Weekly</option>
                <option value="MONTHLY">Repeats Monthly</option>
              </select>
            )}
          </div>

          {/* Subtasks Manager */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <ListTodo className="h-3 w-3 text-slate-400" />
              <span>Subtasks ({subtasks.length})</span>
            </label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st: any, idx: number) => (
                  <div
                    key={st.id || idx}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 border border-white/[0.06]"
                  >
                    <div
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(st.completed)}
                        onChange={() => {}}
                        className="rounded accent-orbit-teal cursor-pointer"
                      />
                      <span className={`truncate ${st.completed ? "line-through text-slate-500" : ""}`}>
                        {st.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-500 hover:text-rose-300 p-0.5 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask step..."
                className="flex-1 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-white placeholder-slate-500 border border-white/[0.1] focus:border-orbit-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-30 text-xs font-mono text-white transition-colors"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <GlassButton
              variant="accent"
              size="md"
              type="submit"
              isLoading={isSaving}
              className="px-5 text-xs font-semibold"
            >
              Save Changes
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
};

interface BreakdownModalProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const BreakdownModal: React.FC<BreakdownModalProps> = ({
  task,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen || !task) return null;

  const existingSteps = (task.subtasks || task.metadata?.subtasks || []).map((s: any) =>
    typeof s === "string" ? s : s.title
  );
  const initialSteps =
    existingSteps.length > 0
      ? existingSteps
      : ["Step 1: Outline structure", "Step 2: Draft first section", "Step 3: Review & finalize"];

  const [steps, setSteps] = useState<string[]>(initialSteps);
  const [newStepText, setNewStepText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setSteps((prev) => [...prev, newStepText.trim()]);
    setNewStepText("");
  };

  const handleRemoveStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateStep = (idx: number, val: string) => {
    const next = [...steps];
    next[idx] = val;
    setSteps(next);
  };

  const handleSave = async () => {
    const validSteps = steps.filter((s) => s.trim().length > 0);
    setIsSaving(true);
    try {
      await fetch("/api/today", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          action: "BREAKDOWN",
          subtasks: validSteps,
        }),
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#0B101D] border border-orbit-teal/40 p-6 shadow-glass-3 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.1]">
          <div className="flex items-center gap-2.5 text-white">
            <Scissors className="h-4 w-4 text-orbit-teal" />
            <h3 className="font-serif text-lg font-semibold">Break Into Steps</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Large tasks feel easier when broken into 20-30 minute bites for{" "}
          <span className="text-white font-medium">"{task.title}"</span>:
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {steps.map((st, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono text-orbit-teal w-5 shrink-0">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={st}
                onChange={(e) => handleUpdateStep(idx, e.target.value)}
                className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2 text-xs text-white border border-white/[0.1] focus:border-orbit-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveStep(idx)}
                className="text-slate-500 hover:text-rose-300 p-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new step row */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddStep();
              }
            }}
            placeholder="Type next step and press Enter..."
            className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-white placeholder-slate-400 border border-white/[0.1] focus:border-orbit-teal focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddStep}
            disabled={!newStepText.trim()}
            className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-30 text-xs font-mono text-white transition-colors"
          >
            + Add
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.1]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <GlassButton
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
            className="px-5 text-xs font-semibold"
          >
            Save Steps
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
