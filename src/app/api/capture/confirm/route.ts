import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";

export const dynamic = "force-dynamic";

const ConfirmItemSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["TASK", "EXAM", "EXPENSE", "INCOME", "HABIT", "GOAL", "EVENT"]),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  effortMin: z.number().optional().nullable(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NORMAL"]).optional().nullable(),
  weight: z.number().optional().nullable(),
  amount: z.number().optional().nullable(),
  category: z.string().optional().nullable(),
  isRecurring: z.boolean().optional().nullable(),
  recurringFrequency: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional().nullable(),
  subtasks: z.array(z.any()).optional().nullable(),
  frequencyDays: z.number().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  courseCode: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

const ConfirmPayloadSchema = z.object({
  entries: z.array(ConfirmItemSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ConfirmPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid confirmation payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const saved = await dataAdapter.saveEntries(parsed.data.entries);

    return NextResponse.json({
      success: true,
      count: parsed.data.entries.length,
      saved,
    });
  } catch (error) {
    console.error("Confirm capture API error:", error);
    return NextResponse.json(
      { error: "Failed to persist captured entries" },
      { status: 500 }
    );
  }
}
