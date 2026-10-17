export type GoalCategory =
  | "Personal"
  | "Career"
  | "Education"
  | "Finance"
  | "Health & Fitness"
  | "Relationships"
  | "Custom"
  | string;

export type GoalPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type GoalStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED";

export type GoalTrackingType = "MILESTONE" | "TASK" | "NUMERIC";

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
  order: number;
  linkedTaskId?: string | null;
}

export interface GoalItem {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: GoalCategory;
  deadline?: string | null;
  color?: string;
  priority: GoalPriority;
  status: GoalStatus;
  trackingType: GoalTrackingType;
  notes?: string | null;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any> | null;
}

export interface GoalAnalytics {
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
  isOverdue: boolean;
  daysRemaining: number | null;
  statusLabel: string;
}

export const GOAL_CATEGORIES: GoalCategory[] = [
  "Personal",
  "Career",
  "Education",
  "Finance",
  "Health & Fitness",
  "Relationships",
  "Custom",
];

export const GOAL_PRIORITIES: GoalPriority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export const GOAL_CATEGORY_COLORS: Record<string, string> = {
  Personal: "#F472B6",       // Pink
  Career: "#E0A458",         // Amber
  Education: "#1F6F6B",      // Teal
  Finance: "#10B981",        // Emerald
  "Health & Fitness": "#38BDF8", // Sky
  Relationships: "#A78BFA",  // Violet
  Custom: "#FB923C",         // Orange
  Other: "#94A3B8",          // Slate
};

/**
 * Calculates genuine goal progress based on its tracking type:
 * - MILESTONE: From completed vs total milestones
 * - TASK: From completed vs total linked tasks in Task Management
 * - NUMERIC: From currentValue vs targetValue
 *
 * Ensures no duplicate counting and does not auto-complete overdue goals.
 */
export function calculateGoalProgress(
  goal: GoalItem,
  linkedTasks: any[] = [],
  now: Date = new Date()
): GoalAnalytics {
  const trackingType = goal.trackingType || "MILESTONE";
  let progressPercentage = 0;
  let completedCount = 0;
  let totalCount = 0;

  if (trackingType === "MILESTONE") {
    const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
    totalCount = milestones.length;
    completedCount = milestones.filter((m) => m.completed).length;

    if (totalCount > 0) {
      progressPercentage = Math.round((completedCount / totalCount) * 100);
    } else if (goal.targetValue > 0) {
      // Fallback to currentValue / targetValue if no milestones are defined
      progressPercentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    }
  } else if (trackingType === "TASK") {
    const matchingTasks = linkedTasks.filter(
      (t) => t.goalId === goal.id || t.metadata?.goalId === goal.id
    );
    totalCount = matchingTasks.length;
    completedCount = matchingTasks.filter((t) => t.status === "COMPLETED").length;

    if (totalCount > 0) {
      progressPercentage = Math.round((completedCount / totalCount) * 100);
    } else if (goal.targetValue > 0) {
      progressPercentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    }
  } else {
    // NUMERIC
    const target = goal.targetValue > 0 ? goal.targetValue : 100;
    const current = Math.max(0, goal.currentValue);
    totalCount = target;
    completedCount = current;
    progressPercentage = Math.min(100, Math.round((current / target) * 100));
  }

  // Calculate days remaining & overdue state
  let isOverdue = false;
  let daysRemaining: number | null = null;

  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0 && goal.status !== "COMPLETED") {
      isOverdue = true;
    }
  }

  let statusLabel = "In Progress";
  if (goal.status === "COMPLETED") {
    statusLabel = "Completed";
  } else if (goal.status === "PAUSED") {
    statusLabel = "Paused";
  } else if (goal.status === "CANCELLED") {
    statusLabel = "Cancelled";
  } else if (goal.status === "NOT_STARTED") {
    statusLabel = "Not Started";
  } else if (isOverdue) {
    statusLabel = "Overdue";
  }

  return {
    progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
    completedCount,
    totalCount,
    isOverdue,
    daysRemaining,
    statusLabel,
  };
}

/**
 * Contextual Milestone Breakdown Generator
 * Provides immediate, smart suggestions to break large goals into actionable steps.
 */
export function generateMilestonesSuggestion(
  title: string,
  category: GoalCategory
): string[] {
  const lower = title.toLowerCase();

  if (/exam|midsem|semester|gate|jee|upsc|cat|study|course/i.test(lower)) {
    return [
      "Audit and review full syllabus breakdown",
      "Complete comprehensive notes for all key modules",
      "Solve previous 3 years question papers",
      "Run timed mock exam and review weak areas",
    ];
  }

  if (/fitness|weight|fat|muscle|gym|marathon|run|workout/i.test(lower)) {
    return [
      "Set weekly exercise schedule and rest days",
      "Establish daily protein and hydration targets",
      "Complete 4 weeks of consistent training",
      "Assess benchmark metrics and adjust intensity",
    ];
  }

  if (/save|money|budget|fund|invest|emergency/i.test(lower)) {
    return [
      "Calculate target amount and monthly savings allocation",
      "Automate initial deposit into dedicated account",
      "Reach 50% milestone of total savings target",
      "Reach 100% full target milestone",
    ];
  }

  if (/code|project|portfolio|app|github|website/i.test(lower)) {
    return [
      "Outline system requirements and database architecture",
      "Build core features and interactive UI components",
      "Write comprehensive test suite and fix edge cases",
      "Deploy live to production and write project README",
    ];
  }

  if (/read|book/i.test(lower)) {
    return [
      "Select reading material and set 15-min daily reading time",
      "Complete first 25% of chapters with highlights",
      "Reach halfway mark and document key learnings",
      "Finish book and write actionable takeaway summary",
    ];
  }

  // Generic fallback based on category
  switch (category) {
    case "Career":
      return [
        "Update resume and portfolio with recent achievements",
        "Target and research 5 key opportunities or certifications",
        "Complete technical preparation and practice interviews",
        "Secure offer or career milestone achievement",
      ];
    case "Education":
      return [
        "Break down curriculum into weekly study blocks",
        "Finish all lecture modules and assignments",
        "Complete revision notes and formula cheat-sheets",
        "Take final assessment with target grade",
      ];
    case "Health & Fitness":
      return [
        "Set daily baseline habit rituals",
        "Track weekly workouts without missing a session",
        "Perform mid-way physical performance check",
        "Achieve target health/fitness milestone",
      ];
    default:
      return [
        "Define clear requirements and timeline for this goal",
        "Take the first foundational action step this week",
        "Review progress at halfway mark and resolve blockers",
        "Complete final deliverables and celebrate milestone",
      ];
  }
}
