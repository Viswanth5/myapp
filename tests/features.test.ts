import { describe, it, expect } from "vitest";
import { calculatePaceMultiplier } from "../src/lib/engine/pace";
import { analyzeEnergyMap } from "../src/lib/engine/energy";
import { detectDeadlineDomino } from "../src/lib/engine/domino";
import { generateSpendStudyCorrelations } from "../src/lib/engine/correlations";
import { generateICS } from "../src/lib/engine/ics";

describe("Stage C Unique Feature Engines", () => {
  it("Pace Engine calculates estimate multiplier accurately", () => {
    const history = [
      { taskId: "1", taskTitle: "T1", estimatedMin: 60, actualMin: 90, completedAt: new Date() }, // 1.5x
      { taskId: "2", taskTitle: "T2", estimatedMin: 40, actualMin: 60, completedAt: new Date() }, // 1.5x
    ];

    const insight = calculatePaceMultiplier(history);
    expect(insight.averageMultiplier).toBe(1.5);
    expect(insight.insightText).toContain("1.5x");
  });

  it("Energy Map identifies peak afternoon study window", () => {
    const energy = analyzeEnergyMap();
    expect(energy.peakHours).toContain("2:00 PM");
    expect(energy.currentLevel).toBe("peak");
  });

  it("Deadline Domino detects cascade risk on carried tasks", () => {
    const tasks = [
      { id: "t1", title: "OS Lab Record #4", carriedCount: 1, effortMin: 90 },
      { id: "t2", title: "DBMS Midsem Exam", effortMin: 180 },
    ];

    const domino = detectDeadlineDomino(tasks);
    expect(domino.hasCascade).toBe(true);
    expect(domino.chain.length).toBeGreaterThan(1);
    expect(domino.summaryMessage).toContain("OS Lab Record");
  });

  it("Spend-to-Study correlates stress with discretionary burn", () => {
    const correlations = generateSpendStudyCorrelations();
    expect(correlations.length).toBeGreaterThanOrEqual(2);
    expect(correlations[0].metric).toContain("Food Spends");
  });

  it("iCalendar exporter outputs valid RFC 5545 format", () => {
    const events = [
      {
        id: "ev-1",
        title: "DBMS Midsem Exam",
        startAt: new Date("2026-10-14T10:00:00Z"),
        endAt: new Date("2026-10-14T13:00:00Z"),
      },
    ];

    const icsContent = generateICS(events);
    expect(icsContent).toContain("BEGIN:VCALENDAR");
    expect(icsContent).toContain("SUMMARY:DBMS Midsem Exam");
    expect(icsContent).toContain("END:VCALENDAR");
  });
});
