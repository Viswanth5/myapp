import { describe, it, expect } from "vitest";
import { calculatePriorityScore, rankTodayStack } from "../src/lib/engine/priority";
import { calculatePressureMeter } from "../src/lib/engine/pressure";
import { handleHabitLog, computeHabitHeatStrip } from "../src/lib/engine/habits";
import { calculateMoneyRunway } from "../src/lib/engine/money";
import { generateExamStudyPlan, reflowStudyPlan } from "../src/lib/engine/exam";
import { processRollover } from "../src/lib/engine/rollover";

describe("Orbit Core Engines Test Suite", () => {
  describe("Priority Engine", () => {
    it("ranks urgent tasks above distant tasks", () => {
      const now = new Date("2026-10-07T10:00:00Z");
      const urgentTask = {
        id: "t1",
        title: "Submit DBMS Assignment",
        dueAt: new Date("2026-10-07T16:00:00Z"), // 6h away
        effortMin: 60,
        weight: 0.8,
      };
      const distantTask = {
        id: "t2",
        title: "Clean room",
        dueAt: new Date("2026-10-14T10:00:00Z"), // 7 days away
        effortMin: 30,
        weight: 0.1,
      };

      const scoreUrgent = calculatePriorityScore(urgentTask, now);
      const scoreDistant = calculatePriorityScore(distantTask, now);

      expect(scoreUrgent.score).toBeGreaterThan(scoreDistant.score);
      expect(scoreUrgent.urgencyLevel).toBe("critical");
      expect(scoreUrgent.explanation).toContain("Due in 6h");
    });

    it("generates timebox slots and caps Must-Do at 5 items", () => {
      const tasks = Array.from({ length: 8 }).map((_, i) => ({
        id: `task-${i}`,
        title: `Task #${i + 1}`,
        dueAt: new Date(Date.now() + (i + 1) * 3600000),
        effortMin: 45,
      }));

      const { mustDo, backlog } = rankTodayStack(tasks);
      expect(mustDo).toHaveLength(5);
      expect(backlog).toHaveLength(3);
      expect(mustDo[0].suggestedSlot).toBeDefined();
      expect(mustDo[0].suggestedSlot?.label).toContain("45 min focus slot");
    });
  });

  describe("Pressure Meter Engine", () => {
    it("detects critical load when weekly hours exceed available capacity", () => {
      const tasks = [
        { id: "1", title: "Heavy Lab Project", effortMin: 400, dueAt: new Date() },
        { id: "2", title: "DBMS Endsem Study", effortMin: 600, dueAt: new Date() },
        { id: "3", title: "OS Assignment", effortMin: 300, dueAt: new Date() },
        { id: "4", title: "Viva Prep", effortMin: 500, dueAt: new Date() },
      ];

      const pressure = calculatePressureMeter(tasks, 20.0); // 20 hours available
      expect(pressure.level).toBe("critical");
      expect(pressure.score).toBeGreaterThanOrEqual(80);
      expect(pressure.suggestedFix).toContain("pressure");
    });
  });

  describe("Habits with Grace Engine", () => {
    it("preserves streak when using a grace day", () => {
      const habit = { streakCount: 5, graceDaysLeft: 2 };
      const result = handleHabitLog(habit, false); // missed day

      expect(result.newStreak).toBe(5); // streak preserved
      expect(result.newGrace).toBe(1); // 1 grace used
      expect(result.usedGrace).toBe(true);
    });

    it("resets streak when grace days are exhausted", () => {
      const habit = { streakCount: 5, graceDaysLeft: 0 };
      const result = handleHabitLog(habit, false);

      expect(result.newStreak).toBe(0);
      expect(result.newGrace).toBe(0);
      expect(result.usedGrace).toBe(false);
    });
  });

  describe("Money Runway Engine", () => {
    it("calculates safe daily spend and burns rate accurately", () => {
      const now = new Date("2026-10-10T12:00:00Z"); // Day 10 of month
      const transactions = [
        { id: "1", amount: 2000, type: "EXPENSE" as const, category: "Food", title: "Canteen & Swiggy", createdAt: new Date("2026-10-05") },
        { id: "2", amount: 1500, type: "EXPENSE" as const, category: "Travel", title: "Metro & Fuel", createdAt: new Date("2026-10-08") },
      ];

      const runway = calculateMoneyRunway(transactions, 12000, [], now);
      expect(runway.totalSpentThisMonth).toBe(3500);
      expect(runway.remainingBudget).toBe(8500);
      expect(runway.dailySafeToSpend).toBeGreaterThan(0);
    });
  });

  describe("Exam Mode Chunker & Dynamic Reflow", () => {
    it("chunks syllabus for exam within 14 days and handles day skips", () => {
      const now = new Date("2026-10-07T10:00:00Z");
      const exam = {
        id: "exam-dbms",
        title: "DBMS Midsem",
        courseCode: "DBMS",
        dueAt: new Date("2026-10-14T10:00:00Z"), // 7 days away
      };

      const plan = generateExamStudyPlan(exam, undefined, now);
      expect(plan).not.toBeNull();
      expect(plan?.isActive).toBe(true);
      expect(plan?.chunks.length).toBe(7);

      // Reflow on day 2 skip
      if (plan) {
        const reflowed = reflowStudyPlan(plan, 2);
        expect(reflowed.chunks[1].isSkipped).toBe(true);
        expect(reflowed.chunks[2].topic).toContain("Rollover");
      }
    });
  });

  describe("Smart Rollover Engine", () => {
    it("flags 3rd carry-over for do/split/drop triage", () => {
      const task = { id: "t1", title: "Physics Record", status: "PENDING", carriedCount: 2 };
      const result = processRollover(task);

      expect(result.carriedCount).toBe(3);
      expect(result.needsTriage).toBe(true);
      expect(result.triagePrompt).toContain("Do it today, Split into smaller steps, or Drop");
    });
  });
});
