import { NextResponse } from "next/server";
import { dataAdapter } from "@/lib/data";
import { generateAttentionRadar } from "@/lib/engine/radar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await dataAdapter.getUser();
    const tasks = await dataAdapter.getTodayEntries();
    const habits = await dataAdapter.getHabits();
    const goals = await dataAdapter.getGoals();
    const transactions = await dataAdapter.getTransactions();

    const monthlySpent = transactions
      .filter((t: any) => t.type === "EXPENSE")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    const radar = generateAttentionRadar({
      tasks: tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt,
        type: t.type,
        weight: t.weight,
      })),
      habits: habits.map((h: any) => ({
        id: h.id,
        name: h.name,
        streakCount: h.streakCount,
        graceDaysLeft: h.graceDaysLeft,
        completedToday: h.logs && h.logs.length > 0 && h.logs[0].completed,
      })),
      goals: goals.map((g: any) => ({
        id: g.id,
        title: g.title,
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        deadline: g.deadline,
      })),
      monthlySpent: monthlySpent || 0,
      monthlyBudget: user.monthlyBudget || 0,
      now: new Date(),
    });

    return NextResponse.json(radar);
  } catch (error) {
    console.error("Radar API error:", error);
    return NextResponse.json({ error: "Failed to generate attention radar" }, { status: 500 });
  }
}
