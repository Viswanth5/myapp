import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGoalProgress,
  generateMilestonesSuggestion,
  GoalItem,
  GoalMilestone,
} from "../src/lib/engine/goals";
import {
  calculateHabitStreak,
  computeHabitHeatStrip,
  handleHabitLog,
  getHabitFeedbackMessage,
  isHabitRequiredOnDay,
  formatDateKey,
  HabitWithLogs,
} from "../src/lib/engine/habits";
import { dataAdapter } from "../src/lib/data";

describe("Goals Engine — Progress & Milestones", () => {
  const fixedNow = new Date("2026-10-16T12:00:00Z");

  it("calculates progress percentage accurately from completed milestones without double-counting", () => {
    const goal: GoalItem = {
      id: "goal-test-1",
      userId: "user-1",
      title: "Learn Rust",
      targetValue: 4,
      currentValue: 2,
      unit: "steps",
      category: "Education",
      priority: "HIGH",
      status: "IN_PROGRESS",
      trackingType: "MILESTONE",
      milestones: [
        { id: "m-1", title: "Read Chapter 1", completed: true, order: 0 },
        { id: "m-2", title: "Complete Exercises", completed: true, order: 1 },
        { id: "m-3", title: "Build CLI tool", completed: false, order: 2 },
        { id: "m-4", title: "Deploy crate", completed: false, order: 3 },
      ],
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const analytics = calculateGoalProgress(goal, [], fixedNow);
    expect(analytics.progressPercentage).toBe(50);
    expect(analytics.completedCount).toBe(2);
    expect(analytics.totalCount).toBe(4);
    expect(analytics.statusLabel).toBe("In Progress");
  });

  it("calculates progress from linked tasks in Task Management", () => {
    const goal: GoalItem = {
      id: "goal-task-sync",
      userId: "user-1",
      title: "Launch Side Project",
      targetValue: 3,
      currentValue: 1,
      unit: "tasks",
      category: "Career",
      priority: "URGENT",
      status: "IN_PROGRESS",
      trackingType: "TASK",
      milestones: [],
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const linkedTasks = [
      { id: "t-1", title: "Design Landing Page", status: "COMPLETED", goalId: "goal-task-sync" },
      { id: "t-2", title: "Configure Stripe", status: "PENDING", goalId: "goal-task-sync" },
      { id: "t-3", title: "Invite 10 Beta Users", status: "PENDING", goalId: "goal-task-sync" },
      { id: "t-other", title: "Unrelated task", status: "COMPLETED", goalId: "other-goal" },
    ];

    const analytics = calculateGoalProgress(goal, linkedTasks, fixedNow);
    expect(analytics.progressPercentage).toBe(33);
    expect(analytics.completedCount).toBe(1);
    expect(analytics.totalCount).toBe(3);
  });

  it("does not automatically mark a goal complete merely because its target date has passed", () => {
    const pastGoal: GoalItem = {
      id: "goal-overdue",
      userId: "user-1",
      title: "Submit Research Paper",
      targetValue: 2,
      currentValue: 1,
      unit: "milestones",
      category: "Education",
      deadline: "2026-10-10T00:00:00Z", // Past date
      priority: "HIGH",
      status: "IN_PROGRESS",
      trackingType: "MILESTONE",
      milestones: [
        { id: "m-1", title: "Write Draft", completed: true, order: 0 },
        { id: "m-2", title: "Peer Review", completed: false, order: 1 },
      ],
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const analytics = calculateGoalProgress(pastGoal, [], fixedNow);
    expect(analytics.isOverdue).toBe(true);
    expect(analytics.statusLabel).toBe("Overdue");
    expect(pastGoal.status).toBe("IN_PROGRESS"); // Not auto-completed!
  });

  it("generates contextual and actionable milestone suggestions based on title & category", () => {
    const examSuggestions = generateMilestonesSuggestion("Midsem Operating Systems Exam", "Education");
    expect(examSuggestions.length).toBeGreaterThanOrEqual(3);
    expect(examSuggestions.some((s) => /syllabus|notes|questions/i.test(s))).toBe(true);

    const fitnessSuggestions = generateMilestonesSuggestion("5km Running Pace", "Health & Fitness");
    expect(fitnessSuggestions.length).toBeGreaterThanOrEqual(3);
    expect(fitnessSuggestions.some((s) => /training|schedule|hydration/i.test(s))).toBe(true);
  });
});

describe("Habits Engine — Streaks, Grace Days & Calendar", () => {
  const fixedNow = new Date("2026-10-16T12:00:00Z"); // Friday

  it("calculates exact streaks strictly from saved logs without fabricating", () => {
    const habit: HabitWithLogs = {
      id: "h-reading",
      name: "Daily Reading",
      frequencyDays: 7,
      frequencyType: "DAILY",
      streakCount: 0,
      graceDaysLeft: 2,
      monthlyGraceMax: 2,
      color: "#E0A458",
      logs: [
        { id: "l-1", date: "2026-10-16T10:00:00Z", completed: true, usedGrace: false }, // Today
        { id: "l-2", date: "2026-10-15T10:00:00Z", completed: true, usedGrace: false }, // Yesterday
        { id: "l-3", date: "2026-10-14T10:00:00Z", completed: true, usedGrace: false }, // 2 days ago
      ],
    };

    const { currentStreak, bestStreak } = calculateHabitStreak(habit, fixedNow);
    expect(currentStreak).toBe(3);
    expect(bestStreak).toBe(3);
  });

  it("keeps yesterday's active streak alive if today is not yet logged", () => {
    const habit: HabitWithLogs = {
      id: "h-meditation",
      name: "Morning Meditation",
      frequencyDays: 7,
      frequencyType: "DAILY",
      streakCount: 0,
      graceDaysLeft: 2,
      monthlyGraceMax: 2,
      color: "#1F6F6B",
      logs: [
        // Today (2026-10-16) is NOT logged yet
        { id: "l-1", date: "2026-10-15T08:00:00Z", completed: true, usedGrace: false },
        { id: "l-2", date: "2026-10-14T08:00:00Z", completed: true, usedGrace: false },
      ],
    };

    const { currentStreak } = calculateHabitStreak(habit, fixedNow);
    expect(currentStreak).toBe(2);
  });

  it("preserves streak when grace day is used", () => {
    const outcome = handleHabitLog({ streakCount: 5, graceDaysLeft: 2 }, false);
    expect(outcome.usedGrace).toBe(true);
    expect(outcome.newStreak).toBe(5); // Preserved!
    expect(outcome.newGrace).toBe(1); // One consumed
  });

  it("resets streak to 0 when grace days are completely exhausted", () => {
    const outcome = handleHabitLog({ streakCount: 5, graceDaysLeft: 0 }, false);
    expect(outcome.usedGrace).toBe(false);
    expect(outcome.newStreak).toBe(0); // Reset
    expect(outcome.newGrace).toBe(0);
  });

  it("respects rest days for selected days habits without breaking streaks", () => {
    // Habit active only on Mondays and Wednesdays (days 1 and 3)
    const isRequiredOnTuesday = isHabitRequiredOnDay("SELECTED_DAYS", [1, 3], 2, 2);
    expect(isRequiredOnTuesday).toBe(false);

    const isRequiredOnMonday = isHabitRequiredOnDay("SELECTED_DAYS", [1, 3], 1, 2);
    expect(isRequiredOnMonday).toBe(true);
  });

  it("generates encouraging, non-guilt-inducing feedback messages", () => {
    const msgDone = getHabitFeedbackMessage(7, true, 2, 2);
    expect(msgDone).toContain("7-day streak");

    const msgNotStarted = getHabitFeedbackMessage(0, false, 2, 2);
    expect(msgNotStarted).not.toContain("failed");
    expect(msgNotStarted).not.toContain("lazy");
    expect(msgNotStarted).toContain("Ready when you are");
  });
});

describe("Data Adapter — Goals & Habits Multi-User Isolation & Mutation", () => {
  const userIdA = "user-test-a";
  const userIdB = "user-test-b";

  beforeEach(() => {
    // Reset stores
    dataAdapter.setGoals([], userIdA);
    dataAdapter.setGoals([], userIdB);
    dataAdapter.setHabits([], userIdA);
    dataAdapter.setHabits([], userIdB);
  });

  it("isolates goals and habits per authenticated user without data leaking", async () => {
    await dataAdapter.addGoal(
      { title: "User A Goal", targetValue: 100, category: "Personal" },
      userIdA
    );
    await dataAdapter.addGoal(
      { title: "User B Goal", targetValue: 50, category: "Career" },
      userIdB
    );

    const userAGoals = await dataAdapter.getGoals(userIdA);
    const userBGoals = await dataAdapter.getGoals(userIdB);

    expect(userAGoals.length).toBe(1);
    expect(userAGoals[0].title).toBe("User A Goal");

    expect(userBGoals.length).toBe(1);
    expect(userBGoals[0].title).toBe("User B Goal");
  });

  it("toggles and prevents duplicate habit logs for the same date", async () => {
    const habit = await dataAdapter.addHabit(
      { name: "Cold Shower", frequencyDays: 7 },
      userIdA
    );

    // First check-in for 2026-10-16
    await dataAdapter.toggleHabitLog(habit.id, "2026-10-16", true, undefined, userIdA);
    let habits = await dataAdapter.getHabits(userIdA);
    let currentHabit = habits.find((h: any) => h.id === habit.id);
    expect(currentHabit.logs.length).toBe(1);
    expect(currentHabit.logs[0].completed).toBe(true);

    // Logging same day again toggles/undoes
    await dataAdapter.toggleHabitLog(habit.id, "2026-10-16", true, undefined, userIdA);
    habits = await dataAdapter.getHabits(userIdA);
    currentHabit = habits.find((h: any) => h.id === habit.id);
    expect(currentHabit.logs.length).toBe(0); // Undone cleanly!
  });

  it("synchronizes linked task completion with goal progress immediately", async () => {
    const goal = await dataAdapter.addGoal(
      {
        title: "Pass Driver Exam",
        trackingType: "TASK",
        category: "Personal",
      },
      userIdA
    );

    const task = await dataAdapter.addEntry(
      {
        type: "TASK",
        title: "Book RTO slot",
        status: "PENDING",
        goalId: goal.id,
      },
      userIdA
    );

    // Complete the task
    await dataAdapter.patchEntry(task.id, "COMPLETE", undefined, userIdA);

    const updatedGoals = await dataAdapter.getGoals(userIdA);
    const linkedGoal = updatedGoals.find((g: any) => g.id === goal.id);
    expect(linkedGoal.currentValue).toBe(1);
    expect(linkedGoal.targetValue).toBe(1);
    expect(linkedGoal.status).toBe("COMPLETED");
  });
});
