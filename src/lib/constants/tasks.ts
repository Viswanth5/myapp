export const STANDARD_TASK_CATEGORIES = [
  "College",
  "Career & Projects",
  "Finance",
  "Goals",
  "Routines & Habits",
  "Health & Fitness",
  "Personal",
] as const;

export type StandardCategory = (typeof STANDARD_TASK_CATEGORIES)[number];

export const TASK_PRIORITIES = [
  { value: "URGENT", label: "Urgent", color: "text-rose-400 bg-rose-500/15 border-rose-500/30", badge: "critical" },
  { value: "HIGH", label: "High", color: "text-amber-300 bg-amber-500/15 border-amber-500/30", badge: "amber" },
  { value: "MEDIUM", label: "Medium", color: "text-teal-300 bg-teal-500/15 border-teal-500/30", badge: "teal" },
  { value: "LOW", label: "Low", color: "text-slate-400 bg-slate-500/15 border-slate-500/30", badge: "outline" },
] as const;

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NORMAL";

export const TASK_STATUSES = [
  { value: "PENDING", label: "Pending", color: "text-slate-300" },
  { value: "IN_PROGRESS", label: "In Progress", color: "text-orbit-amber" },
  { value: "COMPLETED", label: "Completed", color: "text-orbit-teal" },
  { value: "CANCELLED", label: "Cancelled", color: "text-slate-500 line-through" },
] as const;

export const RECURRING_FREQUENCIES = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

export function getCategoryBadgeColor(category?: string | null): string {
  if (!category) return "text-slate-400 border-white/10 bg-white/[0.04]";
  const lower = category.toLowerCase();
  if (lower.includes("college") || lower.includes("study") || lower.includes("academic")) {
    return "text-sky-300 border-sky-500/30 bg-sky-500/10";
  }
  if (lower.includes("career") || lower.includes("project") || lower.includes("work")) {
    return "text-orbit-amber border-orbit-amber/30 bg-orbit-amber/10";
  }
  if (lower.includes("finance") || lower.includes("money") || lower.includes("spend")) {
    return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  }
  if (lower.includes("goal")) {
    return "text-purple-300 border-purple-500/30 bg-purple-500/10";
  }
  if (lower.includes("routine") || lower.includes("habit")) {
    return "text-pink-300 border-pink-500/30 bg-pink-500/10";
  }
  if (lower.includes("health") || lower.includes("fit") || lower.includes("gym")) {
    return "text-teal-300 border-teal-500/30 bg-teal-500/10";
  }
  return "text-slate-300 border-white/15 bg-white/[0.05]";
}
