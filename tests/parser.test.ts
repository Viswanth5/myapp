import { describe, it, expect } from "vitest";
import { parseDeterministic, splitClauses } from "../src/lib/parser/deterministic";

describe("Brain Dump Multi-Intent Parser", () => {
  it("correctly splits multi-clause messy sentences", () => {
    const input = "DBMS assignment due friday 5pm, spent 180 on lunch, gym 3 times a week, save 5000 for laptop by december";
    const clauses = splitClauses(input);
    expect(clauses.length).toBe(4);
  });

  it("accurately parses 4 distinct entry types from prompt sample", () => {
    const input = "DBMS assignment due friday 5pm, spent 180 on lunch, gym 3 times a week, save 5000 for laptop by december";
    const results = parseDeterministic(input);

    expect(results).toHaveLength(4);

    // 1. Task
    const task = results[0];
    expect(task.type).toBe("TASK");
    expect(task.title.toLowerCase()).toContain("dbms");
    expect(task.courseCode).toBe("DBMS");
    expect(task.dueAt).toBeTruthy();

    // 2. Expense
    const expense = results[1];
    expect(expense.type).toBe("EXPENSE");
    expect(expense.amount).toBe(180);
    expect(expense.category).toBe("Food");

    // 3. Habit
    const habit = results[2];
    expect(habit.type).toBe("HABIT");
    expect(habit.title.toLowerCase()).toContain("gym");
    expect(habit.frequencyDays).toBe(3);

    // 4. Goal
    const goal = results[3];
    expect(goal.type).toBe("GOAL");
    expect(goal.targetValue).toBe(5000);
    expect(goal.unit).toBe("INR");
    expect(goal.title.toLowerCase()).toContain("laptop");
  });

  it("handles standalone expenses in Indian Rupees (₹)", () => {
    const input = "spent ₹350 on xerox and lab manuals";
    const results = parseDeterministic(input);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("EXPENSE");
    expect(results[0].amount).toBe(350);
    expect(results[0].category).toBe("Academics");
  });

  it("recognizes upcoming high-weight exams", () => {
    const input = "Operating Systems endsem exam next wednesday 10am";
    const results = parseDeterministic(input);
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("EXAM");
    expect(results[0].weight).toBeGreaterThanOrEqual(0.8);
    expect(results[0].courseCode).toBe("OS");
  });

  it("accurately parses conversational personal life tasks", () => {
    // 1. Career project
    const p1 = parseDeterministic("Finish my project tomorrow");
    expect(p1).toHaveLength(1);
    expect(p1[0].type).toBe("TASK");
    expect(p1[0].title.toLowerCase()).toContain("finish my project");
    expect(p1[0].category).toBe("Career & Projects");
    expect(p1[0].dueAt).toBeTruthy();

    // 2. College office task
    const p2 = parseDeterministic("Call the college office on Friday");
    expect(p2).toHaveLength(1);
    expect(p2[0].type).toBe("TASK");
    expect(p2[0].title.toLowerCase()).toContain("call the college office");
    expect(p2[0].category).toBe("College");
    expect(p2[0].dueAt).toBeTruthy();

    // 3. Ambiguous deadline task
    const p3 = parseDeterministic("I need to complete two pending assignments");
    expect(p3).toHaveLength(1);
    expect(p3[0].type).toBe("TASK");
    expect(p3[0].title.toLowerCase()).toContain("complete two pending assignments");
    expect(p3[0].category).toBe("College");
    expect(p3[0].priority).toBe("HIGH");
    expect(p3[0].isAmbiguous).toBe(true);
    expect(p3[0].clarificationQuestion).toBeTruthy();

    // 4. Duration task vs expense distinction
    const p4 = parseDeterministic("Spend 30 minutes organizing my finances");
    expect(p4).toHaveLength(1);
    expect(p4[0].type).toBe("TASK");
    expect(p4[0].title.toLowerCase()).toContain("organize my finances");
    expect(p4[0].effortMin).toBe(30);
    expect(p4[0].category).toBe("Finance");
  });

  it("handles empty or whitespace input gracefully", () => {
    expect(parseDeterministic("")).toEqual([]);
    expect(parseDeterministic("   ")).toEqual([]);
  });
});
