export interface PressureMetric {
  score: number; // 0 to 100
  level: "calm" | "moderate" | "heavy" | "critical";
  totalEffortHours: number;
  availableHours: number;
  workloadRatio: number; // percentage
  statusText: string;
  suggestedFix: string;
  dailyDistribution: {
    dayName: string;
    date: string;
    effortHours: number;
    capacityHours: number;
    isOverloaded: boolean;
    itemCount: number;
  }[];
}

export interface TaskEffort {
  id: string;
  title: string;
  dueAt?: Date | string | null;
  effortMin?: number | null;
  type?: string;
}

export function calculatePressureMeter(
  tasks: TaskEffort[],
  weeklyFreeHours: number = 28.0,
  now: Date = new Date()
): PressureMetric {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyDistribution: PressureMetric["dailyDistribution"] = [];

  let totalEffortMin = 0;
  const dailyEffortMap: Record<string, { minutes: number; count: number }> = {};

  // Initialize next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    dailyEffortMap[dateKey] = { minutes: 0, count: 0 };
  }

  // Aggregate effort
  for (const task of tasks) {
    const effort = task.effortMin || 45;
    totalEffortMin += effort;

    if (task.dueAt) {
      const dueDate = new Date(task.dueAt);
      const dateKey = dueDate.toISOString().split("T")[0];
      if (dailyEffortMap[dateKey]) {
        dailyEffortMap[dateKey].minutes += effort;
        dailyEffortMap[dateKey].count += 1;
      }
    }
  }

  const dailyCapacityHours = Math.round((weeklyFreeHours / 7) * 10) / 10;
  let maxDayOverload = { day: "", hours: 0, count: 0 };

  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split("T")[0];
    const dayName = i === 0 ? "Today" : i === 1 ? "Tmrw" : daysOfWeek[d.getDay()];
    const effortHrs = Math.round((dailyEffortMap[dateKey]?.minutes || 0) / 60 * 10) / 10;
    const isOverloaded = effortHrs > dailyCapacityHours * 1.25;

    if (effortHrs > maxDayOverload.hours) {
      maxDayOverload = {
        day: dayName,
        hours: effortHrs,
        count: dailyEffortMap[dateKey]?.count || 0,
      };
    }

    dailyDistribution.push({
      dayName,
      date: dateKey,
      effortHours: effortHrs,
      capacityHours: dailyCapacityHours,
      isOverloaded,
      itemCount: dailyEffortMap[dateKey]?.count || 0,
    });
  }

  const totalEffortHours = Math.round((totalEffortMin / 60) * 10) / 10;
  const workloadRatio = Math.round((totalEffortHours / weeklyFreeHours) * 100);

  // Pressure score 0-100
  let score = Math.min(100, Math.round(workloadRatio * 0.9 + (maxDayOverload.hours > dailyCapacityHours ? 15 : 0)));
  if (totalEffortHours === 0) score = 12;

  let level: PressureMetric["level"] = "calm";
  let statusText = "Smooth Sailing";
  let suggestedFix = "You're in great shape. Perfect time for revision or downtime.";

  if (score >= 80) {
    level = "critical";
    statusText = "Heavy Overload Detected";
    suggestedFix = `Peak pressure on ${maxDayOverload.day} (${maxDayOverload.hours}h work). Move 1-2 lower priority tasks to the weekend.`;
  } else if (score >= 60) {
    level = "heavy";
    statusText = "Busy Week Ahead";
    suggestedFix = `Clustering on ${maxDayOverload.day}. Start lab records or assignments 1 day earlier.`;
  } else if (score >= 35) {
    level = "moderate";
    statusText = "Comfortable Pace";
    suggestedFix = "Manageable load. Keep an eye on mid-week submissions.";
  }

  return {
    score,
    level,
    totalEffortHours,
    availableHours: weeklyFreeHours,
    workloadRatio,
    statusText,
    suggestedFix,
    dailyDistribution,
  };
}
