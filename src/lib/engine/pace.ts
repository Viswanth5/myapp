export interface PaceSession {
  taskId: string;
  taskTitle: string;
  estimatedMin: number;
  actualMin: number;
  courseCode?: string;
  completedAt: Date | string;
}

export interface PaceInsight {
  averageMultiplier: number; // e.g. 1.35
  totalSessions: number;
  insightText: string;
  recommendation: string;
}

const DEFAULT_HISTORY: PaceSession[] = [
  { taskId: "1", taskTitle: "OS Lab Record #3", estimatedMin: 60, actualMin: 85, courseCode: "OS", completedAt: new Date(Date.now() - 3 * 86400000) },
  { taskId: "2", taskTitle: "DBMS Normalization Practice", estimatedMin: 45, actualMin: 60, courseCode: "DBMS", completedAt: new Date(Date.now() - 5 * 86400000) },
  { taskId: "3", taskTitle: "CN Socket Programming", estimatedMin: 90, actualMin: 120, courseCode: "CN", completedAt: new Date(Date.now() - 7 * 86400000) },
];

export function calculatePaceMultiplier(history: PaceSession[] = DEFAULT_HISTORY): PaceInsight {
  if (history.length === 0) {
    return {
      averageMultiplier: 1.0,
      totalSessions: 0,
      insightText: "Pace engine calibrating (first 3 focus sessions)",
      recommendation: "Focus times will auto-calibrate after completing study blocks.",
    };
  }

  const ratios = history.map((s) => (s.estimatedMin > 0 ? s.actualMin / s.estimatedMin : 1.0));
  const avg = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100;

  let insightText = `You usually take ${avg}x your initial estimate on assignments.`;
  let recommendation = `VIRA has adjusted future timeboxes by +${Math.round((avg - 1) * 100)}% buffer to protect your schedule.`;

  if (avg <= 1.05 && avg >= 0.95) {
    insightText = "Spot on! Your time estimation accuracy is 96%.";
    recommendation = "Your schedule timeboxing is highly reliable.";
  } else if (avg < 0.9) {
    insightText = `You work faster than planned (${avg}x estimated time).`;
    recommendation = "You have extra buffer in your daily slots.";
  }

  return {
    averageMultiplier: avg,
    totalSessions: history.length,
    insightText,
    recommendation,
  };
}
