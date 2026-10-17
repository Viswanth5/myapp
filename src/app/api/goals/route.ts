import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import {
  calculateGoalProgress,
  generateMilestonesSuggestion,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalTrackingType,
} from "@/lib/engine/goals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rawGoals, allEntries] = await Promise.all([
      dataAdapter.getGoals(),
      dataAdapter.getEntries(),
    ]);

    const tasks = (allEntries || []).filter((e: any) => e.type === "TASK");
    const now = new Date();

    const goals = (rawGoals || []).map((goal: any) => {
      const milestones = Array.isArray(goal.milestones)
        ? goal.milestones
        : Array.isArray(goal.metadata?.milestones)
        ? goal.metadata.milestones
        : [];

      const linkedTasks = tasks.filter(
        (t: any) => t.goalId === goal.id || t.metadata?.goalId === goal.id
      );

      const normalizedGoal = {
        ...goal,
        milestones,
      };

      const analytics = calculateGoalProgress(normalizedGoal, linkedTasks, now);

      return {
        ...normalizedGoal,
        progressPercentage: analytics.progressPercentage,
        completedMilestonesCount: analytics.completedCount,
        totalMilestonesCount: analytics.totalCount,
        isOverdue: analytics.isOverdue,
        daysRemaining: analytics.daysRemaining,
        statusLabel: analytics.statusLabel,
        linkedTasksCount: linkedTasks.length,
        linkedTasksCompletedCount: linkedTasks.filter((t: any) => t.status === "COMPLETED").length,
      };
    });

    // Summary metrics
    const activeGoals = goals.filter((g: any) => g.status === "IN_PROGRESS" || g.status === "NOT_STARTED");
    const completedGoals = goals.filter((g: any) => g.status === "COMPLETED");
    const overdueGoals = goals.filter((g: any) => g.isOverdue);
    const averageProgress =
      goals.length > 0
        ? Math.round(goals.reduce((acc: number, g: any) => acc + g.progressPercentage, 0) / goals.length)
        : 0;

    return NextResponse.json({
      goals,
      metrics: {
        total: goals.length,
        active: activeGoals.length,
        completed: completedGoals.length,
        overdue: overdueGoals.length,
        averageProgress,
      },
    });
  } catch (error) {
    console.error("Goals API error:", error);
    return NextResponse.json({ error: "Failed to load goals" }, { status: 500 });
  }
}

const MilestoneItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Milestone title required"),
  completed: z.boolean().optional().default(false),
  createLinkedTask: z.boolean().optional().default(false),
});

const CreateGoalSchema = z.object({
  action: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  category: z.string().optional().default("Personal"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"]).optional().default("IN_PROGRESS"),
  trackingType: z.enum(["MILESTONE", "TASK", "NUMERIC"]).optional().default("MILESTONE"),
  targetDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional().default(0),
  unit: z.string().optional(),
  color: z.string().optional().default("#38BDF8"),
  notes: z.string().optional().default(""),
  milestones: z.array(MilestoneItemSchema).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // AI suggestions helper for milestones
    if (body.action === "SUGGEST_MILESTONES") {
      const title = body.title || "";
      const category = (body.category || "Personal") as GoalCategory;
      const suggestions = generateMilestonesSuggestion(title, category);
      return NextResponse.json({ success: true, suggestions });
    }

    const parsed = CreateGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid goal data" }, { status: 400 });
    }

    const { targetDate, deadline, milestones, ...rest } = parsed.data;
    const finalDeadline = deadline || targetDate || null;

    // Build milestone list
    const mappedMilestones = (milestones || []).map((m, idx) => ({
      id: m.id || `m-${Date.now()}-${idx}`,
      title: m.title.trim(),
      completed: Boolean(m.completed),
      completedAt: m.completed ? new Date().toISOString() : null,
      order: idx,
      linkedTaskId: null as string | null,
    }));

    const goal = await dataAdapter.addGoal?.({
      ...rest,
      deadline: finalDeadline,
      milestones: mappedMilestones,
    });

    // If user requested to create linked tasks in Task Management for any milestone
    const createdTasks = [];
    if (goal && milestones) {
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (m.createLinkedTask) {
          const newTask = await dataAdapter.addEntry?.({
            type: "TASK",
            title: `${m.title.trim()}`,
            category: rest.category || "Personal",
            priority: rest.priority || "MEDIUM",
            goalId: goal.id,
            metadata: {
              goalId: goal.id,
              milestoneId: mappedMilestones[i]?.id,
              isFromGoalMilestone: true,
            },
          });
          if (newTask && mappedMilestones[i]) {
            mappedMilestones[i].linkedTaskId = newTask.id;
            createdTasks.push(newTask);
          }
        }
      }
      // Update goal with linkedTaskIds if tasks were created
      if (createdTasks.length > 0) {
        await dataAdapter.updateGoal?.(goal.id, { milestones: mappedMilestones });
      }
    }

    return NextResponse.json({ success: true, goal, createdTasksCount: createdTasks.length });
  } catch (error) {
    console.error("Create Goal error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

const PatchGoalSchema = z.object({
  id: z.string(),
  action: z.string().optional(),
  milestoneId: z.string().optional(),
  milestoneTitle: z.string().optional(),
  completed: z.boolean().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  targetDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  contribution: z.number().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PatchGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid goal update" }, { status: 400 });
    }

    const { id, action, milestoneId, milestoneTitle, completed, contribution, ...updates } = parsed.data;

    // Handle Milestone mutations
    if (action === "TOGGLE_MILESTONE" && milestoneId) {
      const updated = await dataAdapter.patchGoalMilestone?.(id, "TOGGLE", { milestoneId, completed });
      return NextResponse.json({ success: true, goal: updated });
    }

    if (action === "ADD_MILESTONE" && milestoneTitle) {
      const updated = await dataAdapter.patchGoalMilestone?.(id, "ADD", { title: milestoneTitle });
      return NextResponse.json({ success: true, goal: updated });
    }

    if (action === "DELETE_MILESTONE" && milestoneId) {
      const updated = await dataAdapter.patchGoalMilestone?.(id, "DELETE", { milestoneId });
      return NextResponse.json({ success: true, goal: updated });
    }

    // Quick contribution increment for numeric goals
    if (contribution !== undefined) {
      const goals = await dataAdapter.getGoals();
      const existing = goals?.find((g: any) => g.id === id);
      if (existing) {
        updates.currentValue = (Number(existing.currentValue) || 0) + Number(contribution);
      }
    }

    if (updates.targetDate !== undefined) {
      updates.deadline = updates.targetDate;
    }

    const updated = await dataAdapter.updateGoal?.(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal: updated });
  } catch (error) {
    console.error("Update Goal error:", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const result = await dataAdapter.deleteGoal?.(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delete Goal error:", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
