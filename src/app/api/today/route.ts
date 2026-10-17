import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter, getUserDisplayName } from "@/lib/data";
import { rankTodayStack } from "@/lib/engine/priority";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await dataAdapter.getUser();

    // Check if Supabase user metadata has fresh name or preferences
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.user_metadata) {
        const meta = authData.user.user_metadata;
        if (meta.name !== undefined) user.name = meta.name;
        if (meta.preferredName !== undefined) user.preferredName = meta.preferredName;
        if (meta.userType !== undefined) user.userType = meta.userType;
        if (meta.occupation !== undefined) user.occupation = meta.occupation;
        if (meta.focusAreas !== undefined) user.focusAreas = meta.focusAreas;
        if (meta.mainGoals !== undefined) user.mainGoals = meta.mainGoals;
        if (meta.primaryFocus !== undefined) user.primaryFocus = meta.primaryFocus;
        if (meta.educationDetails !== undefined) user.educationDetails = meta.educationDetails;
      }
    } catch {
      // Offline fallback
    }

    const displayName = getUserDisplayName(user);
    user.displayName = displayName;

    const pendingEntries = await dataAdapter.getTodayEntries();

    const priorityInputs = pendingEntries.map((e: any) => ({
      id: e.id,
      title: e.title,
      dueAt: e.dueAt,
      effortMin: e.effortMin,
      weight: e.weight,
      carriedCount: e.carriedCount || 0,
      snoozeCount: e.snoozeCount || 0,
      hasLinkedGoal: Boolean(e.goalId),
      type: e.type,
      status: e.status,
      course: e.course,
      goal: e.goal,
      metadata: e.metadata || {},
    }));

    const ranked = rankTodayStack(priorityInputs);

    const allEntries = await dataAdapter.getEntries();
    const completedTasks = allEntries.filter((e: any) => e.status === "COMPLETED");
    const completedToday = completedTasks.length;

    // Determine Today's Focus task (explicitly marked with isFocus: true)
    let focusTask = pendingEntries.find((e: any) => e.metadata?.isFocus === true) || null;

    // Follow-ups: tasks carried over or due within next 24h
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 3600000);
    const pendingFollowUps = pendingEntries.filter((e: any) => {
      const isCarried = (e.carriedCount || 0) > 0;
      const isDueSoon = e.dueAt && new Date(e.dueAt) <= next24h;
      return (isCarried || isDueSoon) && e.id !== focusTask?.id;
    });

    const allTasks = allEntries.filter((e: any) => e.type === "TASK" || !e.type);

    return NextResponse.json({
      focusTask,
      mustDo: ranked.mustDo,
      backlog: ranked.backlog,
      completedTasks,
      allTasks,
      totalPending: pendingEntries.length,
      completedToday,
      pendingFollowUps,
      user: {
        id: user.id,
        name: user.name || "",
        preferredName: user.preferredName || "",
        displayName: displayName || user.preferredName || user.name || "",
        userType: user.userType || "",
        occupation: user.occupation || "",
        focusAreas: user.focusAreas || [],
        mainGoals: user.mainGoals || [],
        primaryFocus: user.primaryFocus || "",
        educationDetails: user.educationDetails || null,
        startingBalance: user.startingBalance || 0,
        monthlyBudget: user.monthlyBudget || 0,
        monthlyIncome: user.monthlyIncome || 0,
        workoutTargetDays: user.workoutTargetDays || 0,
        completedWorkoutsThisWeek: user.completedWorkoutsThisWeek || 0,
        lastCheckInDate: user.lastCheckInDate || "",
      },
    });
  } catch (error) {
    console.error("Today API error:", error);
    return NextResponse.json({ error: "Failed to fetch Today stack" }, { status: 500 });
  }
}

const CreateEntrySchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().default(""),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NORMAL"]).optional().default("MEDIUM"),
  dueAt: z.string().nullable().optional(),
  effortMin: z.number().optional().default(30),
  isFocus: z.boolean().optional().default(false),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional().default("PENDING"),
  subtasks: z.array(z.string()).optional(),
  category: z.string().optional().default("Personal"),
  isRecurring: z.boolean().optional().default(false),
  recurringFrequency: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional().default("NONE"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid task data", details: parsed.error.format() }, { status: 400 });
    }

    const {
      title,
      description,
      priority,
      dueAt,
      effortMin,
      isFocus,
      status,
      subtasks,
      category,
      isRecurring,
      recurringFrequency,
    } = parsed.data;

    const subtaskObjects = Array.isArray(subtasks)
      ? subtasks.map((st) => ({
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: st,
          completed: false,
        }))
      : [];

    const normPriority = priority === "NORMAL" ? "LOW" : priority;
    const weight = normPriority === "URGENT" ? 0.95 : normPriority === "HIGH" ? 0.85 : normPriority === "MEDIUM" ? 0.6 : 0.4;
    const priorityScore = normPriority === "URGENT" ? 95 : normPriority === "HIGH" ? 85 : normPriority === "MEDIUM" ? 65 : 45;

    const newEntry = await dataAdapter.addEntry({
      type: "TASK",
      title,
      description,
      status,
      dueAt: dueAt || new Date(Date.now() + 8 * 3600000).toISOString(),
      effortMin,
      priority: normPriority,
      weight: isFocus ? 0.95 : weight,
      priorityScore: isFocus ? 95 : priorityScore,
      category,
      isRecurring,
      recurringFrequency,
      subtasks: subtaskObjects,
      metadata: {
        description,
        priority: normPriority,
        isFocus,
        isRecurring,
        recurringFrequency,
        subtasks: subtaskObjects,
      },
    });

    if (isFocus) {
      await dataAdapter.patchEntry(newEntry.id, "SET_FOCUS");
    }

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error("Create task API error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

const PatchEntrySchema = z.object({
  id: z.string(),
  action: z.enum([
    "COMPLETE",
    "UNCOMPLETE",
    "CONTINUE_WORKING",
    "CANCEL",
    "SET_STATUS",
    "SNOOZE",
    "ROLLOVER",
    "DROP",
    "DELETE",
    "SET_FOCUS",
    "UNSET_FOCUS",
    "EDIT",
    "RESCHEDULE",
    "ADD_SUBTASK",
    "TOGGLE_SUBTASK",
    "DELETE_SUBTASK",
    "BREAKDOWN",
    "UPDATE_EFFORT",
  ]),
  payload: z.any().optional(),
  effortMin: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  dueAt: z.string().nullable().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NORMAL"]).optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  subtaskId: z.string().optional(),
  subtasks: z.array(z.string()).optional(),
  hours: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PatchEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid patch payload" }, { status: 400 });
    }

    const { id, action } = parsed.data;
    // Combine explicit fields with payload
    const payload = parsed.data.payload || {
      effortMin: parsed.data.effortMin,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      status: parsed.data.status,
      dueAt: parsed.data.dueAt,
      priority: parsed.data.priority,
      isRecurring: parsed.data.isRecurring,
      recurringFrequency: parsed.data.recurringFrequency,
      subtaskId: parsed.data.subtaskId,
      subtasks: parsed.data.subtasks,
      hours: parsed.data.hours,
    };

    const updated = await dataAdapter.patchEntry(id, action, payload);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Patch Today API error:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
