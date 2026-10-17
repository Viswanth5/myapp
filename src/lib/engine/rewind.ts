export interface WeeklyRewindData {
  weekRange: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  carriedTasks: number;
  totalSpent: number;
  habitsHeldScore: number; // percentage
  topAchievement: string;
  humanSummary: string;
  focusSuggestions: [string, string, string];
}

export function generateWeeklyRewind(data: {
  completedTasks: number;
  totalTasks: number;
  carriedTasks: number;
  totalSpent: number;
  habitsStreakAverage: number;
  topSubject?: string;
  now?: Date;
}): WeeklyRewindData {
  const completionRate = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 100;

  const habitsHeldScore = Math.min(100, Math.round(data.habitsStreakAverage * 20));

  let humanSummary = `Solid week of progress. You crossed off ${data.completedTasks} tasks and kept habits steady.`;
  if (completionRate >= 80) {
    humanSummary = `Phenomenal week! ${data.completedTasks} priorities wrapped with high consistency.`;
  } else if (completionRate < 50) {
    humanSummary = `A high-demand week with ${data.carriedTasks} items carried. Take Sunday to reset and recalibrate.`;
  }

  const focusSuggestions: [string, string, string] = [
    data.topSubject
      ? `Frontload ${data.topSubject} work early in the week`
      : `Frontload top-priority milestones before Wednesday for breathing room`,
    `Cap discretionary spending within daily limits to extend your financial runway`,
    `Protect your daily habit streak using your 2 monthly grace days wisely`,
  ];

  return {
    weekRange: "Past 7 Days",
    completedTasks: data.completedTasks,
    totalTasks: data.totalTasks,
    completionRate,
    carriedTasks: data.carriedTasks,
    totalSpent: data.totalSpent,
    habitsHeldScore,
    topAchievement: `${data.completedTasks} priorities & focus blocks finished`,
    humanSummary,
    focusSuggestions,
  };
}
