import { NextResponse } from "next/server";
import { dataAdapter, getUserDisplayName } from "@/lib/data";
import { generateWeeklyRewind } from "@/lib/engine/rewind";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const latestRewind = await dataAdapter.getRewind();

    if (latestRewind) {
      const suggestions =
        typeof latestRewind.focusSuggestions === "string"
          ? JSON.parse(latestRewind.focusSuggestions)
          : latestRewind.focusSuggestions || [];

      return NextResponse.json({
        rewind: {
          ...latestRewind,
          focusSuggestions: suggestions,
        },
      });
    }

    const user = await dataAdapter.getUser();
    const tasks = await dataAdapter.getEntries();
    const habits = await dataAdapter.getHabits();
    const expenses = await dataAdapter.getTransactions();

    const completed = tasks.filter((t: any) => t.status === "COMPLETED").length;
    const carried = tasks.reduce((sum: number, t: any) => sum + (t.carriedCount || 0), 0);
    const spent = expenses
      .filter((e: any) => e.type === "EXPENSE")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const streaks = habits.map((h: any) => h.streakCount || 0);
    const avgStreak = streaks.length > 0 ? streaks.reduce((a: number, b: number) => a + b, 0) / streaks.length : 0;

    const synthesized = generateWeeklyRewind({
      completedTasks: completed,
      totalTasks: tasks.length,
      carriedTasks: carried,
      totalSpent: spent,
      habitsStreakAverage: avgStreak,
      topSubject: user.branch || user.occupation || "Daily Execution",
    });

    const displayName = getUserDisplayName(user);

    return NextResponse.json({
      rewind: {
        ...synthesized,
        userName: displayName,
      },
    });
  } catch (error) {
    console.error("Rewind API error:", error);
    return NextResponse.json({ error: "Failed to load weekly rewind" }, { status: 500 });
  }
}
