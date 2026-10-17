import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDateKey } from "@/lib/engine/habits";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await dataAdapter.getUser();

    // Check Supabase session
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.user_metadata) {
        const meta = authData.user.user_metadata;
        if (meta.name) user.name = meta.name;
        if (meta.lastCheckInDate) user.lastCheckInDate = meta.lastCheckInDate;
        if (meta.focusAreas) user.focusAreas = meta.focusAreas;
      }
    } catch {
      // Offline fallback
    }

    const todayDateStr = formatDateKey(new Date());
    const isCompletedToday = user.lastCheckInDate === todayDateStr;

    const [allEntries, habits, goals] = await Promise.all([
      dataAdapter.getTodayEntries(),
      dataAdapter.getHabits(),
      dataAdapter.getGoals(),
    ]);

    const carriedTasks = (allEntries || []).filter((e: any) => (e.carriedCount || 0) > 0);
    const existingPending = (allEntries || []).filter((e: any) => e.status !== "COMPLETED");

    // Dynamic contextual questions based on user's real setup
    const focusAreas = user.focusAreas || [];
    const hasCollege = focusAreas.some((f: string) => /college|academic|study|university/i.test(f));
    const hasFinance = focusAreas.some((f: string) => /finance|money|budget|saving/i.test(f)) || (user.monthlyBudget && user.monthlyBudget > 0);
    const hasFitness = focusAreas.some((f: string) => /fitness|health|gym|workout/i.test(f)) || (user.workoutTargetDays && user.workoutTargetDays > 0);

    const questions: Array<{ id: string; question: string; type: string; [key: string]: any }> = [
      {
        id: "tasks",
        question: "What do you need to get done today?",
        type: "MULTI_TASK",
      },
    ];

    if (carriedTasks.length > 0) {
      questions.push({
        id: "carried",
        question: `Your task "${carriedTasks[0].title}" is still pending. Would you like to work on it today?`,
        type: "CARRIED_TRIAGE",
      });
    }

    // Unlogged habits check-in
    const activeHabits = (habits || []).filter((h: any) => h.status !== "ARCHIVED" && h.status !== "PAUSED");
    const unloggedHabits = activeHabits.filter((h: any) => {
      const logs = Array.isArray(h.logs) ? h.logs : [];
      return !logs.some((l: any) => {
        const d = typeof l.date === "string" ? l.date.split("T")[0] : new Date(l.date).toISOString().split("T")[0];
        return d === todayDateStr && (l.completed || l.usedGrace);
      });
    });

    if (unloggedHabits.length > 0) {
      questions.push({
        id: "habits",
        question: "Which daily habits would you like to log for today?",
        type: "HABIT_CHECKIN",
        habitsList: unloggedHabits.map((h: any) => ({
          id: h.id,
          name: h.name,
          streakCount: h.streakCount || 0,
          color: h.color || "#E0A458",
        })),
      });
    }

    // Goal setup prompt if user has no goals or wants monthly milestone
    if (!goals || goals.length === 0) {
      questions.push({
        id: "monthly_goal",
        question: "What is one important goal you want to achieve this month?",
        type: "GOAL_SETUP",
      });
    }

    if (hasCollege) {
      questions.push({
        id: "college",
        question: "Do you have any college work or study deadlines pending today?",
        type: "COLLEGE_CHECK",
      });
    }

    questions.push({
      id: "focus",
      question: "Which task is your main priority today?",
      type: "FOCUS_PICKER",
    });

    if (hasFinance) {
      questions.push({
        id: "expenses",
        question: "Do you have any expenses to record today?",
        type: "EXPENSE_INPUT",
      });
    }

    if (hasFitness) {
      questions.push({
        id: "workout",
        question: "Would you like to schedule a workout or activity today?",
        type: "WORKOUT_TOGGLE",
      });
    }

    return NextResponse.json({
      isCompletedToday,
      todayDateStr,
      lastCheckInDate: user.lastCheckInDate || null,
      userName: user.name || "Explorer",
      carriedTasks,
      existingPending,
      questions,
    });
  } catch (error) {
    console.error("Check-in GET error:", error);
    return NextResponse.json({ error: "Failed to fetch check-in status" }, { status: 500 });
  }
}

const PostCheckInSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        category: z.string().optional().default("Personal"),
        priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NORMAL"]).optional().default("MEDIUM"),
        dueAt: z.string().optional().nullable(),
        effortMin: z.number().optional().default(45),
        isFocus: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  focusTaskId: z.string().optional().nullable(),
  carriedDecisions: z
    .array(
      z.object({
        id: z.string(),
        action: z.enum(["keep", "reschedule", "drop"]),
      })
    )
    .optional()
    .default([]),
  expense: z
    .object({
      title: z.string().min(1),
      amount: z.number().min(0),
      category: z.string().optional().default("Personal"),
    })
    .optional()
    .nullable(),
  workoutScheduled: z.boolean().optional().default(false),
  habitCheckIns: z
    .array(
      z.object({
        habitId: z.string(),
        completed: z.boolean(),
        note: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  newGoal: z
    .object({
      title: z.string().min(1),
      category: z.string().optional().default("Personal"),
      milestones: z.array(z.string()).optional().default([]),
    })
    .optional()
    .nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = PostCheckInSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid check-in submission", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      tasks,
      focusTaskId,
      carriedDecisions,
      expense,
      workoutScheduled,
      habitCheckIns,
      newGoal,
    } = parsed.data;
    const todayDateStr = formatDateKey(new Date());

    // 1. Create new tasks entered in check-in
    let createdFocusId: string | null = null;
    for (const t of tasks) {
      const normPriority = t.priority === "NORMAL" ? "LOW" : t.priority;
      const weight = normPriority === "URGENT" ? 0.95 : normPriority === "HIGH" ? 0.85 : normPriority === "MEDIUM" ? 0.6 : 0.4;
      const score = normPriority === "URGENT" ? 95 : normPriority === "HIGH" ? 85 : normPriority === "MEDIUM" ? 65 : 45;
      const newEntry = await dataAdapter.addEntry({
        type: "TASK",
        title: t.title,
        category: t.category || "Personal",
        dueAt: t.dueAt || new Date(Date.now() + 8 * 3600000).toISOString(),
        effortMin: t.effortMin || 45,
        priority: normPriority,
        weight: t.isFocus ? 0.95 : weight,
        priorityScore: t.isFocus ? 95 : score,
        metadata: {
          priority: normPriority,
          isFocus: t.isFocus,
          subtasks: [],
        },
      });

      if (t.isFocus) {
        createdFocusId = newEntry.id;
      }
    }

    // 2. Set Focus Task
    const effectiveFocusId = focusTaskId || createdFocusId;
    if (effectiveFocusId) {
      await dataAdapter.patchEntry(effectiveFocusId, "SET_FOCUS");
    }

    // 3. Process carried decisions
    for (const dec of carriedDecisions) {
      if (dec.action === "drop") {
        await dataAdapter.patchEntry(dec.id, "DROP");
      } else if (dec.action === "reschedule") {
        await dataAdapter.patchEntry(dec.id, "RESCHEDULE");
      }
    }

    // 4. Save habit check-ins
    if (habitCheckIns && habitCheckIns.length > 0) {
      for (const hc of habitCheckIns) {
        await dataAdapter.toggleHabitLog?.(hc.habitId, todayDateStr, hc.completed, hc.note);
      }
    }

    // 5. Save conversational new goal if submitted
    if (newGoal && newGoal.title.trim()) {
      const milestones = (newGoal.milestones || []).map((mTitle, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        title: mTitle.trim(),
        completed: false,
        order: idx,
      }));
      await dataAdapter.addGoal?.({
        title: newGoal.title.trim(),
        category: newGoal.category || "Personal",
        trackingType: milestones.length > 0 ? "MILESTONE" : "NUMERIC",
        targetValue: milestones.length > 0 ? milestones.length : 100,
        milestones,
      });
    }

    // 6. Save expense if entered
    if (expense && expense.amount > 0) {
      await dataAdapter.addEntry({
        type: "EXPENSE",
        title: expense.title,
        amount: expense.amount,
        category: expense.category || "Personal",
        status: "COMPLETED",
        dueAt: new Date().toISOString(),
      });
    }

    // 7. Schedule workout if toggled
    if (workoutScheduled) {
      await dataAdapter.addEntry({
        type: "TASK",
        title: "Daily Workout & Movement",
        effortMin: 45,
        category: "Fitness",
        dueAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        weight: 0.6,
        priorityScore: 60,
        metadata: {
          priority: "MEDIUM",
          isWorkout: true,
        },
      });
    }

    // 8. Persist check-in completion for today
    dataAdapter.setUserData({ lastCheckInDate: todayDateStr });

    // Update Supabase auth metadata if connected
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          lastCheckInDate: todayDateStr,
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      lastCheckInDate: todayDateStr,
      tasksAdded: tasks.length,
      habitsCheckedCount: habitCheckIns.length,
    });
  } catch (error) {
    console.error("Check-in POST error:", error);
    return NextResponse.json({ error: "Failed to save daily check-in" }, { status: 500 });
  }
}
