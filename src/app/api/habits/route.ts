import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { computeHabitHeatStrip, formatDateKey } from "@/lib/engine/habits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawHabits = await dataAdapter.getHabits();
    const now = new Date();

    const heatStrips = (rawHabits || []).map((h: any) =>
      computeHabitHeatStrip(
        {
          id: h.id,
          name: h.name,
          description: h.description,
          category: h.category || "General",
          frequencyType: h.frequencyType || "DAILY",
          frequencyDays: h.frequencyDays || 7,
          targetDaysOfWeek: Array.isArray(h.targetDaysOfWeek) ? h.targetDaysOfWeek : [0, 1, 2, 3, 4, 5, 6],
          dailyTarget: h.dailyTarget || 1,
          reminderTime: h.reminderTime || null,
          status: h.status || "ACTIVE",
          startDate: h.startDate,
          streakCount: h.streakCount || 0,
          bestStreak: h.bestStreak || 0,
          graceDaysLeft: h.graceDaysLeft ?? 2,
          monthlyGraceMax: h.monthlyGraceMax || 2,
          color: h.color || "#E0A458",
          logs: Array.isArray(h.logs) ? h.logs : [],
        },
        28, // 4-week matrix for rich heatmap
        now
      )
    );

    const completedTodayCount = heatStrips.filter((h: any) => h.isCompletedToday).length;
    const activeStreaksCount = heatStrips.filter((h: any) => h.streakCount > 0).length;
    const avgMonthlyRate =
      heatStrips.length > 0
        ? Math.round(
            heatStrips.reduce((sum: number, h: any) => sum + h.monthlyCompletionRate, 0) / heatStrips.length
          )
        : 0;

    return NextResponse.json({
      habits: heatStrips,
      metrics: {
        total: heatStrips.length,
        completedToday: completedTodayCount,
        activeStreaks: activeStreaksCount,
        averageMonthlyRate: avgMonthlyRate,
      },
    });
  } catch (error) {
    console.error("Habits API error:", error);
    return NextResponse.json({ error: "Failed to load habits" }, { status: 500 });
  }
}

const CreateHabitSchema = z.object({
  action: z.literal("CREATE").optional(),
  name: z.string().min(1, "Habit name is required"),
  description: z.string().optional().default(""),
  category: z.string().optional().default("Health & Fitness"),
  frequencyType: z.enum(["DAILY", "SELECTED_DAYS", "WEEKLY_TARGET"]).optional().default("DAILY"),
  frequencyDays: z.number().min(1).max(7).optional().default(7),
  targetDaysOfWeek: z.array(z.number().min(0).max(6)).optional().default([0, 1, 2, 3, 4, 5, 6]),
  dailyTarget: z.number().positive().optional().default(1),
  reminderTime: z.string().nullable().optional(),
  color: z.string().optional().default("#E0A458"),
  monthlyGraceMax: z.number().min(0).max(5).optional().default(2),
  startDate: z.string().optional(),
});

const HabitCheckSchema = z.object({
  habitId: z.string(),
  date: z.string().optional(), // YYYY-MM-DD
  completed: z.boolean(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a creation request
    if (body.action === "CREATE" || (body.name && !body.habitId)) {
      const parsedCreate = CreateHabitSchema.safeParse(body);
      if (!parsedCreate.success) {
        return NextResponse.json(
          { error: parsedCreate.error.issues[0]?.message || "Invalid habit creation payload" },
          { status: 400 }
        );
      }

      const habit = await dataAdapter.addHabit?.(parsedCreate.data);
      return NextResponse.json({ success: true, habit });
    }

    // Otherwise, this is a check-in / date-logging action
    const parsedCheck = HabitCheckSchema.safeParse(body);
    if (!parsedCheck.success) {
      return NextResponse.json({ error: "Invalid habit check payload" }, { status: 400 });
    }

    const { habitId, completed, note } = parsedCheck.data;
    const targetDateStr = parsedCheck.data.date || formatDateKey(new Date());

    const updatedHabit = await dataAdapter.toggleHabitLog?.(
      habitId,
      targetDateStr,
      completed,
      note
    );

    if (!updatedHabit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      habit: updatedHabit,
      date: targetDateStr,
      completed,
    });
  } catch (error) {
    console.error("Habit check/create error:", error);
    return NextResponse.json({ error: "Failed to process habit request" }, { status: 500 });
  }
}

const UpdateHabitSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  frequencyType: z.enum(["DAILY", "SELECTED_DAYS", "WEEKLY_TARGET"]).optional(),
  frequencyDays: z.number().min(1).max(7).optional(),
  targetDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dailyTarget: z.number().positive().optional(),
  reminderTime: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  color: z.string().optional(),
  graceDaysLeft: z.number().optional(),
  monthlyGraceMax: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateHabitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid habit update" }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;
    const updated = await dataAdapter.updateHabit?.(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, habit: updated });
  } catch (error) {
    console.error("Update Habit error:", error);
    return NextResponse.json({ error: "Failed to update habit" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Habit ID is required" }, { status: 400 });
    }

    const result = await dataAdapter.deleteHabit?.(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delete Habit error:", error);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
