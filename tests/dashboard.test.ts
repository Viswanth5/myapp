import { describe, it, expect, beforeEach } from "vitest";
import { parseDeterministic } from "../src/lib/parser/deterministic";
import { dataAdapter, demoStore } from "../src/lib/data";

describe("Dashboard & Check-In Features", () => {
  beforeEach(() => {
    // Reset test store
    demoStore.entries = [];
    demoStore.user = {
      id: "test-user",
      name: "Viswanth",
      focusAreas: ["College & Academics", "Finances & Budget", "Health & Fitness"],
      startingBalance: 15000,
      monthlyBudget: 8000,
      workoutTargetDays: 4,
      completedWorkoutsThisWeek: 1,
      lastCheckInDate: "",
    };
  });

  describe("Conversational Check-In & Task Focus", () => {
    it("creates tasks and sets today focus correctly", async () => {
      const task1 = await dataAdapter.addEntry({
        type: "TASK",
        title: "Finish DBMS project report",
        effortMin: 60,
      });

      const task2 = await dataAdapter.addEntry({
        type: "TASK",
        title: "Submit physics lab manual",
        effortMin: 45,
      });

      expect(demoStore.entries.length).toBe(2);

      // Set focus on task 1
      await dataAdapter.patchEntry(task1.id, "SET_FOCUS");

      const updated1 = demoStore.entries.find((e) => e.id === task1.id);
      const updated2 = demoStore.entries.find((e) => e.id === task2.id);

      expect(updated1?.metadata?.isFocus).toBe(true);
      expect(updated2?.metadata?.isFocus).toBeFalsy();
    });

    it("supports subtasks: adding, toggling, and breaking down", async () => {
      const task = await dataAdapter.addEntry({
        type: "TASK",
        title: "Prepare for Seminar",
      });

      // Add subtasks via BREAKDOWN
      await dataAdapter.patchEntry(task.id, "BREAKDOWN", {
        subtasks: ["Draft outline", "Create slides", "Rehearse speech"],
      });

      const updated = demoStore.entries.find((e) => e.id === task.id);
      expect(updated?.metadata?.subtasks?.length).toBe(3);
      expect(updated?.metadata?.subtasks[0].completed).toBe(false);

      // Toggle first subtask
      const subtaskId = updated?.metadata?.subtasks[0].id;
      await dataAdapter.patchEntry(task.id, "TOGGLE_SUBTASK", { subtaskId });

      const toggled = demoStore.entries.find((e) => e.id === task.id);
      expect(toggled?.metadata?.subtasks[0].completed).toBe(true);
    });

    it("handles rollover and snooze without automatically dropping or completing tasks", async () => {
      const task = await dataAdapter.addEntry({
        type: "TASK",
        title: "Pending Assignment",
        dueAt: new Date().toISOString(),
      });

      // Rollover
      await dataAdapter.patchEntry(task.id, "ROLLOVER");
      const rolled = demoStore.entries.find((e) => e.id === task.id);
      expect(rolled?.carriedCount).toBe(1);
      expect(rolled?.status).toBe("ROLLED_OVER");

      // Snooze
      await dataAdapter.patchEntry(task.id, "SNOOZE", { hours: 4 });
      const snoozed = demoStore.entries.find((e) => e.id === task.id);
      expect(snoozed?.snoozeCount).toBe(1);
    });
  });

  describe("Deterministic Quick Capture Multi-Intent", () => {
    it("parses multi-intent sentence with task and petrol expense without amount", () => {
      const input = "I need to finish my project tomorrow and record my petrol expense";
      const parsed = parseDeterministic(input);

      expect(parsed.length).toBe(2);

      const taskItem = parsed.find((p) => p.type === "TASK");
      expect(taskItem).toBeDefined();
      expect(taskItem?.title.toLowerCase()).toContain("finish my project");

      const expenseItem = parsed.find((p) => p.type === "EXPENSE");
      expect(expenseItem).toBeDefined();
      expect(expenseItem?.category).toBe("Travel");
      expect(expenseItem?.clarificationQuestion).toBeDefined();
    });

    it("parses multi-intent sentence with task and expense with amount", () => {
      const input = "Submit biology assignment and record my petrol expense 350";
      const parsed = parseDeterministic(input);

      expect(parsed.length).toBe(2);

      const expenseItem = parsed.find((p) => p.type === "EXPENSE");
      expect(expenseItem).toBeDefined();
      expect(expenseItem?.amount).toBe(350);
      expect(expenseItem?.category).toBe("Travel");
    });
  });
});
