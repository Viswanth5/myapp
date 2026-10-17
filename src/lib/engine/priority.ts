export interface PriorityInput {
  id: string;
  title: string;
  dueAt?: Date | string | null;
  effortMin?: number | null;
  weight?: number | null;
  carriedCount?: number;
  snoozeCount?: number;
  hasLinkedGoal?: boolean;
  type?: string;
  status?: string;
}

export interface ScoredEntry extends PriorityInput {
  priorityScore: number;
  explanation: string;
  suggestedSlot?: {
    start: string;
    end: string;
    label: string;
  };
  urgencyLevel: "critical" | "high" | "medium" | "low";
}

/**
 * Calculates priority score:
 * Urgency (time to deadline) + Weight (academic/exam) + Effort Fit + Overdue Penalty + Goal Link - Snooze Fatigue
 */
export function calculatePriorityScore(item: PriorityInput, now: Date = new Date()): { score: number; explanation: string; urgencyLevel: "critical" | "high" | "medium" | "low" } {
  let score = 20; // baseline
  const explanations: string[] = [];
  let urgencyLevel: "critical" | "high" | "medium" | "low" = "medium";

  // 1. URGENCY
  if (item.dueAt) {
    const dueDate = new Date(item.dueAt);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue
      const daysOverdue = Math.abs(Math.floor(diffHours / 24)) + 1;
      score += 70 + Math.min(daysOverdue * 10, 30);
      explanations.push(`Overdue by ${daysOverdue}d`);
      urgencyLevel = "critical";
    } else if (diffHours <= 6) {
      score += 60;
      explanations.push(`Due in ${Math.round(diffHours)}h`);
      urgencyLevel = "critical";
    } else if (diffHours <= 24) {
      score += 45;
      explanations.push(`Due in ${Math.round(diffHours)}h`);
      urgencyLevel = "high";
    } else if (diffHours <= 48) {
      score += 30;
      explanations.push(`Due tomorrow`);
      urgencyLevel = "high";
    } else if (diffHours <= 120) {
      score += 18;
      const days = Math.round(diffHours / 24);
      explanations.push(`Due in ${days} days`);
      urgencyLevel = "medium";
    } else {
      score += 5;
      urgencyLevel = "low";
    }
  }

  // 2. WEIGHT (Exams / High-credit assignments)
  const weight = item.weight ?? 0.4;
  if (weight >= 0.8) {
    score += 25;
    explanations.push("High Academic Weight (Finals/Midsem)");
  } else if (weight >= 0.5) {
    score += 15;
    explanations.push("Major Assignment");
  }

  // 3. EFFORT FIT
  const effort = item.effortMin ?? 45;
  if (effort <= 30) {
    score += 8; // Quick wins give slight priority bump
    explanations.push(`Quick ${effort}m`);
  } else if (effort >= 120) {
    score += 12; // Deep work needs early start
    explanations.push(`Deep work (${Math.round(effort / 60)}h)`);
  } else {
    explanations.push(`${effort}m effort`);
  }

  // 4. OVERDUE & CARRIED PENALTY
  const carried = item.carriedCount ?? 0;
  if (carried > 0) {
    score += carried * 8;
    explanations.push(`Carried ${carried}x`);
  }

  // 5. GOAL LINKAGE BONUS
  if (item.hasLinkedGoal) {
    score += 12;
    explanations.push("Links to Active Goal");
  }

  // 6. SNOOZE FATIGUE DEDUCTION
  const snooze = item.snoozeCount ?? 0;
  if (snooze > 0) {
    score -= Math.min(snooze * 6, 20);
  }

  return {
    score: Math.max(0, Math.round(score)),
    explanation: explanations.slice(0, 3).join(" • "),
    urgencyLevel,
  };
}

/**
 * Auto Time-boxing: Generates suggested daily schedule slots for Today's tasks
 */
export function generateTimeBoxes(tasks: ScoredEntry[], startHour: number = 14): ScoredEntry[] {
  let currentHour = startHour;
  let currentMin = 0;

  return tasks.map((task) => {
    const duration = task.effortMin || 45;
    const endMinutesTotal = currentHour * 60 + currentMin + duration;
    const endH = Math.floor(endMinutesTotal / 60);
    const endM = endMinutesTotal % 60;

    const formatTime = (h: number, m: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
    };

    const slot = {
      start: formatTime(currentHour, currentMin),
      end: formatTime(endH, endM),
      label: `${duration} min focus slot`,
    };

    // advance time + 15 min buffer
    const nextStartTotal = endMinutesTotal + 15;
    currentHour = Math.floor(nextStartTotal / 60);
    currentMin = nextStartTotal % 60;

    return {
      ...task,
      suggestedSlot: slot,
    };
  });
}

/**
 * Rank and separate Today Stack into Top 5 Must-Do and Backlog
 */
export function rankTodayStack(items: PriorityInput[], now: Date = new Date()): {
  mustDo: ScoredEntry[];
  backlog: ScoredEntry[];
  totalScore: number;
} {
  const scored = items.map((item) => {
    const { score, explanation, urgencyLevel } = calculatePriorityScore(item, now);
    return {
      ...item,
      priorityScore: score,
      explanation,
      urgencyLevel,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const timeboxed = generateTimeBoxes(scored);
  const mustDo = timeboxed.slice(0, 5);
  const backlog = timeboxed.slice(5);

  const totalScore = scored.reduce((acc, curr) => acc + curr.priorityScore, 0);

  return {
    mustDo,
    backlog,
    totalScore,
  };
}
