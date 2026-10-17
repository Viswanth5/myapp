export type HabitFrequencyType = "DAILY" | "SELECTED_DAYS" | "WEEKLY_TARGET";
export type HabitStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export interface HabitLogEntry {
  id: string;
  habitId?: string;
  date: Date | string;
  completed: boolean;
  usedGrace: boolean;
  note?: string | null;
  createdAt?: Date | string;
}

export interface HabitWithLogs {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  frequencyType?: HabitFrequencyType;
  frequencyDays: number;
  targetDaysOfWeek?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday)
  dailyTarget?: number;
  reminderTime?: string | null;
  status?: HabitStatus;
  startDate?: Date | string | null;
  streakCount: number;
  bestStreak?: number;
  graceDaysLeft: number;
  monthlyGraceMax: number;
  color: string;
  logs: HabitLogEntry[];
}

export type DotStatus = "completed" | "grace" | "missed" | "rest" | "future" | "pending";

export interface DayDot {
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayName: string;
  dayOfWeek: number; // 0-6
  status: DotStatus;
  isToday: boolean;
  isRequired: boolean;
  note?: string;
}

export interface HabitHeatStrip {
  habitId: string;
  habitName: string;
  description?: string;
  category: string;
  frequencyType: HabitFrequencyType;
  frequencyDays: number;
  color: string;
  streakCount: number;
  bestStreak: number;
  graceDaysLeft: number;
  monthlyGraceMax: number;
  dots: DayDot[];
  weeklyCompletionRate: number; // percentage in last 7 days
  monthlyCompletionRate: number; // percentage in last 30 days
  totalCompletions: number;
  statusMessage: string;
  isCompletedToday: boolean;
  status: HabitStatus;
  reminderTime?: string | null;
}

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Determine if a habit is required on a given day of the week (0 = Sunday, 1 = Monday, etc.)
 */
export function isHabitRequiredOnDay(
  frequencyType: HabitFrequencyType = "DAILY",
  targetDaysOfWeek?: number[],
  dayOfWeek: number = 0,
  frequencyDays: number = 7
): boolean {
  if (frequencyType === "DAILY") {
    return true;
  }
  if (frequencyType === "SELECTED_DAYS" && Array.isArray(targetDaysOfWeek) && targetDaysOfWeek.length > 0) {
    return targetDaysOfWeek.includes(dayOfWeek);
  }
  // For weekly target, if frequencyDays >= 6, required nearly daily; otherwise flexible
  return frequencyDays >= 6;
}

/**
 * Accurately calculate current streak and best streak from real saved logs.
 * Never fabricates streaks or counts unlogged days as completed.
 */
export function calculateHabitStreak(
  habit: HabitWithLogs,
  now: Date = new Date()
): { currentStreak: number; bestStreak: number } {
  if (!habit.logs || habit.logs.length === 0) {
    return { currentStreak: 0, bestStreak: habit.bestStreak || 0 };
  }

  // Map logs by YYYY-MM-DD
  const logMap = new Map<string, HabitLogEntry>();
  for (const log of habit.logs) {
    const d = new Date(log.date);
    const key = formatDateKey(d);
    logMap.set(key, log);
  }

  const todayKey = formatDateKey(now);
  const todayDayOfWeek = now.getDay();
  const freqType: HabitFrequencyType = habit.frequencyType || "DAILY";
  const targetDays = habit.targetDaysOfWeek || [];
  const freqDays = habit.frequencyDays || 7;

  // Check today's status
  const todayLog = logMap.get(todayKey);
  const isTodayRequired = isHabitRequiredOnDay(freqType, targetDays, todayDayOfWeek, freqDays);

  let currentStreak = 0;

  if (todayLog && (todayLog.completed || todayLog.usedGrace)) {
    // Today is already completed or used grace -> start counting from today
    currentStreak++;
    // Walk backwards starting from yesterday
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const key = formatDateKey(checkDate);
      const dayOfWeek = checkDate.getDay();
      const isReq = isHabitRequiredOnDay(freqType, targetDays, dayOfWeek, freqDays);

      const log = logMap.get(key);
      if (log && (log.completed || log.usedGrace)) {
        currentStreak++;
      } else if (!isReq) {
        // Scheduled rest day: does not break streak, but doesn't add to streak count
      } else {
        // Required day missed or unlogged in past -> streak breaks
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
      // Safety limit: don't loop forever
      if (currentStreak > 365) break;
    }
  } else if (todayLog && !todayLog.completed && !todayLog.usedGrace) {
    // Explicitly missed today without grace -> streak is 0
    currentStreak = 0;
  } else {
    // Today not yet logged: check if streak from yesterday is still alive
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);

    let yesterdayAlive = false;
    while (true) {
      const key = formatDateKey(checkDate);
      const dayOfWeek = checkDate.getDay();
      const isReq = isHabitRequiredOnDay(freqType, targetDays, dayOfWeek, freqDays);

      const log = logMap.get(key);
      if (log && (log.completed || log.usedGrace)) {
        currentStreak++;
        yesterdayAlive = true;
      } else if (!isReq && !yesterdayAlive) {
        // Yesterday was a rest day, keep looking back to see if streak carries forward
      } else if (!isReq && yesterdayAlive) {
        // Past rest day during an active streak
      } else {
        // Required day missed or unlogged
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
      if (currentStreak > 365) break;
    }
  }

  // Calculate historical best streak
  let bestStreak = Math.max(habit.bestStreak || 0, currentStreak);

  // Scan all unique dates in logs sorted ascending
  const sortedDates = Array.from(logMap.keys()).sort();
  if (sortedDates.length > 0) {
    let runningStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const log = logMap.get(dateStr)!;
      const curDate = new Date(dateStr + "T00:00:00");

      if (log.completed || log.usedGrace) {
        if (!prevDate) {
          runningStreak = 1;
        } else {
          // Check if contiguous days
          const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            runningStreak++;
          } else {
            // Check if days in between were non-required rest days
            let allRest = true;
            for (let d = 1; d < diffDays; d++) {
              const middleDate = new Date(prevDate);
              middleDate.setDate(middleDate.getDate() + d);
              if (isHabitRequiredOnDay(freqType, targetDays, middleDate.getDay(), freqDays)) {
                allRest = false;
                break;
              }
            }
            if (allRest) {
              runningStreak++;
            } else {
              runningStreak = 1;
            }
          }
        }
        prevDate = curDate;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
        prevDate = null;
      }
    }
  }

  return { currentStreak, bestStreak };
}

/**
 * Generate friendly, neutral, and encouraging feedback message
 */
export function getHabitFeedbackMessage(
  streakCount: number,
  isCompletedToday: boolean,
  graceDaysLeft: number,
  monthlyGraceMax: number
): string {
  if (isCompletedToday) {
    if (streakCount >= 21) {
      return `${streakCount}-day streak! Masterful consistency.`;
    }
    if (streakCount >= 7) {
      return `${streakCount}-day streak! Strong momentum building.`;
    }
    if (streakCount > 1) {
      return `${streakCount}-day streak active. Keep going!`;
    }
    return `Logged for today. Great start!`;
  }

  if (streakCount > 0) {
    if (graceDaysLeft < monthlyGraceMax) {
      return `${streakCount}-day streak • ${graceDaysLeft} grace day${graceDaysLeft === 1 ? "" : "s"} left this month`;
    }
    return `${streakCount}-day streak waiting for today's check-in`;
  }

  return `Ready when you are. Check in to begin your streak!`;
}

/**
 * Compute the 21-day or N-day heat strip with actual logs and rates
 */
export function computeHabitHeatStrip(
  habit: HabitWithLogs,
  daysCount: number = 21,
  now: Date = new Date()
): HabitHeatStrip {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dots: DayDot[] = [];

  const logMap = new Map<string, HabitLogEntry>();
  for (const log of habit.logs || []) {
    const d = new Date(log.date);
    const key = formatDateKey(d);
    logMap.set(key, log);
  }

  const todayKey = formatDateKey(now);
  const freqType: HabitFrequencyType = habit.frequencyType || "DAILY";
  const targetDays = habit.targetDaysOfWeek || [];
  const freqDays = habit.frequencyDays || 7;

  let completedOrGraceCount = 0;
  let totalCompletions = 0;
  let last7Completions = 0;
  let last7Required = 0;
  let last30Completions = 0;
  let last30Required = 0;

  // Compute 30-day rates
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = formatDateKey(d);
    const dayOfWeek = d.getDay();
    const isReq = isHabitRequiredOnDay(freqType, targetDays, dayOfWeek, freqDays);
    if (isReq) last30Required++;

    const log = logMap.get(key);
    if (log && (log.completed || log.usedGrace)) {
      last30Completions++;
      if (i < 7) {
        last7Completions++;
      }
    }
    if (i < 7 && isReq) {
      last7Required++;
    }
  }

  // Count total historical completions
  for (const log of habit.logs || []) {
    if (log.completed || log.usedGrace) {
      totalCompletions++;
    }
  }

  // Generate dots for the requested daysCount (e.g. 21 days)
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    const dayOfMonth = d.getDate();
    const dayOfWeek = d.getDay();
    const dayName = daysOfWeek[dayOfWeek];
    const isToday = dateStr === todayKey;
    const isRequired = isHabitRequiredOnDay(freqType, targetDays, dayOfWeek, freqDays);

    const log = logMap.get(dateStr);
    let status: DotStatus = "rest";

    if (log) {
      if (log.completed) {
        status = "completed";
        completedOrGraceCount++;
      } else if (log.usedGrace) {
        status = "grace";
        completedOrGraceCount++;
      } else {
        status = "missed";
      }
    } else {
      if (isToday) {
        status = isRequired ? "pending" : "rest";
      } else if (isRequired) {
        status = "missed";
      } else {
        status = "rest";
      }
    }

    dots.push({
      dateStr,
      dayOfMonth,
      dayName,
      dayOfWeek,
      status,
      isToday,
      isRequired,
      note: log?.note || undefined,
    });
  }

  const { currentStreak, bestStreak } = calculateHabitStreak(habit, now);

  const weeklyCompletionRate = last7Required > 0
    ? Math.min(100, Math.round((last7Completions / last7Required) * 100))
    : 100;

  const monthlyCompletionRate = last30Required > 0
    ? Math.min(100, Math.round((last30Completions / last30Required) * 100))
    : 100;

  const todayLog = logMap.get(todayKey);
  const isCompletedToday = Boolean(todayLog && (todayLog.completed || todayLog.usedGrace));

  const statusMessage = getHabitFeedbackMessage(
    currentStreak,
    isCompletedToday,
    habit.graceDaysLeft,
    habit.monthlyGraceMax
  );

  return {
    habitId: habit.id,
    habitName: habit.name,
    description: habit.description || undefined,
    category: habit.category || "General",
    frequencyType: freqType,
    frequencyDays: freqDays,
    color: habit.color || "#E0A458",
    streakCount: currentStreak,
    bestStreak,
    graceDaysLeft: habit.graceDaysLeft,
    monthlyGraceMax: habit.monthlyGraceMax,
    dots,
    weeklyCompletionRate,
    monthlyCompletionRate,
    totalCompletions,
    statusMessage,
    isCompletedToday,
    status: habit.status || "ACTIVE",
    reminderTime: habit.reminderTime || null,
  };
}

/**
 * Handle habit check-in: if user misses or logs, determine if grace day applies
 */
export function handleHabitLog(
  habit: { streakCount: number; graceDaysLeft: number; monthlyGraceMax?: number },
  completed: boolean
): { newStreak: number; newGrace: number; usedGrace: boolean } {
  if (completed) {
    return {
      newStreak: habit.streakCount + 1,
      newGrace: habit.graceDaysLeft,
      usedGrace: false,
    };
  }

  // If incomplete, can grace day save it?
  if (habit.graceDaysLeft > 0) {
    return {
      newStreak: habit.streakCount, // streak preserved by grace!
      newGrace: habit.graceDaysLeft - 1,
      usedGrace: true,
    };
  }

  // Grace exhausted -> streak resets
  return {
    newStreak: 0,
    newGrace: 0,
    usedGrace: false,
  };
}
