export interface RadarThreat {
  id: string;
  type: "DEADLINE_CLUSTER" | "BUDGET_DRIFT" | "STREAK_AT_RISK" | "GOAL_BEHIND" | "UPCOMING_EXAM";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  actionPrompt: string;
  dueDate?: string;
  dayOffset: number; // 0 to 6
  metric?: string;
}

export interface RadarData {
  threats: RadarThreat[];
  dayHeatmap: {
    dayOffset: number;
    dayLabel: string;
    date: string;
    threatScore: number; // 0 to 100 (determines radar glow)
    hasExam: boolean;
    taskCount: number;
  }[];
  criticalCount: number;
}

export interface RadarInput {
  tasks: Array<{ id: string; title: string; dueAt?: Date | string | null; type?: string; weight?: number | null }>;
  habits: Array<{ id: string; name: string; streakCount: number; graceDaysLeft: number; completedToday?: boolean }>;
  goals: Array<{ id: string; title: string; targetValue: number; currentValue: number; deadline?: Date | string | null }>;
  monthlySpent: number;
  monthlyBudget: number;
  now?: Date;
}

export function generateAttentionRadar(input: RadarInput): RadarData {
  const now = input.now || new Date();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const threats: RadarThreat[] = [];

  // Group tasks by day offset 0-6
  const tasksByDay: Record<number, typeof input.tasks> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const examDays = new Set<number>();

  for (const task of input.tasks) {
    if (task.dueAt) {
      const dueDate = new Date(task.dueAt);
      const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        tasksByDay[diffDays].push(task);
        if (task.type === "EXAM" || (task.weight && task.weight >= 0.8)) {
          examDays.add(diffDays);
        }
      }
    }
  }

  // 1. DEADLINE CLUSTERS
  for (let day = 0; day < 7; day++) {
    const dayTasks = tasksByDay[day];
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + day);
    const dayName = day === 0 ? "Today" : day === 1 ? "Tomorrow" : daysOfWeek[targetDate.getDay()];

    if (dayTasks.length >= 3) {
      threats.push({
        id: `cluster-day-${day}`,
        type: "DEADLINE_CLUSTER",
        severity: dayTasks.length >= 4 ? "critical" : "warning",
        title: `${dayTasks.length} Deadlines on ${dayName}`,
        description: `Submissions piling up: ${dayTasks.map((t) => t.title).slice(0, 2).join(", ")}${dayTasks.length > 2 ? "..." : ""}`,
        actionPrompt: "Reschedule 1-2 items to earlier in the week",
        dayOffset: day,
        dueDate: targetDate.toISOString(),
      });
    }

    // Check high-stakes exams
    const examsOnDay = dayTasks.filter((t) => t.type === "EXAM");
    if (examsOnDay.length > 0) {
      threats.push({
        id: `exam-day-${day}`,
        type: "UPCOMING_EXAM",
        severity: "critical",
        title: `${examsOnDay[0].title} in ${day === 0 ? "hours" : `${day} days`}`,
        description: "High academic weight. Exam Mode study plan active.",
        actionPrompt: "Review flashcards & syllabus chunk",
        dayOffset: day,
        dueDate: targetDate.toISOString(),
      });
    }
  }

  // 2. HABIT STREAKS AT RISK
  for (const habit of input.habits) {
    if (!habit.completedToday && habit.streakCount >= 3) {
      const isCritical = habit.graceDaysLeft === 0;
      threats.push({
        id: `habit-${habit.id}`,
        type: "STREAK_AT_RISK",
        severity: isCritical ? "critical" : "warning",
        title: `${habit.name} Streak (${habit.streakCount} days) at risk`,
        description: isCritical
          ? "No grace days remaining this month. Miss today and streak resets!"
          : `1 grace day left. Check off today to preserve grace buffer.`,
        actionPrompt: "Log completion",
        dayOffset: 0,
      });
    }
  }

  // 3. BUDGET OVERSPEND PACE
  const currentDayOfMonth = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = currentDayOfMonth / totalDaysInMonth;
  const expectedSpend = input.monthlyBudget * monthProgress;

  if (input.monthlySpent > expectedSpend * 1.2 && input.monthlyBudget > 0) {
    const overspendPercent = Math.round(((input.monthlySpent - expectedSpend) / expectedSpend) * 100);
    threats.push({
      id: "budget-drift",
      type: "BUDGET_DRIFT",
      severity: overspendPercent > 35 ? "critical" : "warning",
      title: `Spending Pace +${overspendPercent}% ahead of budget`,
      description: `Spent ₹${input.monthlySpent.toLocaleString("en-IN")} of ₹${input.monthlyBudget.toLocaleString("en-IN")}. Runway narrowing.`,
      actionPrompt: "Adjust daily limit to ₹" + Math.max(0, Math.round((input.monthlyBudget - input.monthlySpent) / Math.max(1, totalDaysInMonth - currentDayOfMonth))),
      dayOffset: 0,
      metric: `+${overspendPercent}%`,
    });
  }

  // 4. GOALS FALLING BEHIND
  for (const goal of input.goals) {
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const daysLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const progressRatio = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 1;

      if (daysLeft < 30 && progressRatio < 0.4) {
        threats.push({
          id: `goal-${goal.id}`,
          type: "GOAL_BEHIND",
          severity: "warning",
          title: `Goal: ${goal.title} (${Math.round(progressRatio * 100)}%)`,
          description: `${daysLeft} days until target date. Needs ₹${Math.round(goal.targetValue - goal.currentValue)} more.`,
          actionPrompt: "Allocate weekly savings",
          dayOffset: 1,
        });
      }
    }
  }

  // Compute 7-day heatmap score for radial visualization
  const dayHeatmap = [];
  for (let d = 0; d < 7; d++) {
    const dObj = new Date(now);
    dObj.setDate(dObj.getDate() + d);
    const dayLabel = d === 0 ? "Today" : d === 1 ? "Tomorrow" : daysOfWeek[dObj.getDay()];
    const dayTaskCount = tasksByDay[d]?.length || 0;
    const hasExam = examDays.has(d);

    let threatScore = dayTaskCount * 22;
    if (hasExam) threatScore += 45;
    threatScore = Math.min(100, threatScore);

    dayHeatmap.push({
      dayOffset: d,
      dayLabel,
      date: dObj.toISOString(),
      threatScore,
      hasExam,
      taskCount: dayTaskCount,
    });
  }

  const criticalCount = threats.filter((t) => t.severity === "critical").length;

  return {
    threats,
    dayHeatmap,
    criticalCount,
  };
}
