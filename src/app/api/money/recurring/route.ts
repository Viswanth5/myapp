import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recurringSpends = (await dataAdapter.getRecurringSpends?.()) || [];
    return NextResponse.json({ recurringSpends });
  } catch (error) {
    console.error("Recurring Spends GET error:", error);
    return NextResponse.json({ error: "Failed to load recurring commitments" }, { status: 500 });
  }
}

const AddRecurringSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  dayOfMonth: z.number().int().min(1).max(31).optional().default(1),
  category: z.string().optional().default("General"),
  frequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "CUSTOM"]).optional().default("MONTHLY"),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional().default("ACTIVE"),
  nextDueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddRecurringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { name, amount, dayOfMonth, category, frequency, status, nextDueDate, notes } = parsed.data;

    // Calculate a default next due date if not provided
    let calculatedNextDue = nextDueDate;
    if (!calculatedNextDue) {
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      if (target < now) {
        target.setMonth(target.getMonth() + 1);
      }
      calculatedNextDue = target.toISOString();
    }

    const newSpend = await dataAdapter.addRecurringSpend({
      name,
      amount,
      dayOfMonth,
      category,
      frequency,
      status,
      nextDueDate: calculatedNextDue,
      notes: notes || "",
      isPaid: false,
    });

    return NextResponse.json({ success: true, recurringSpend: newSpend });
  } catch (error) {
    console.error("Add Recurring error:", error);
    return NextResponse.json({ error: "Failed to create recurring commitment" }, { status: 500 });
  }
}

const UpdateRecurringSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["RECORD_PAID", "UPDATE"]).optional().default("UPDATE"),
  name: z.string().optional(),
  amount: z.number().positive().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  category: z.string().optional(),
  frequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "CUSTOM"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  nextDueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isPaid: z.boolean().optional(),
  paymentMethod: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateRecurringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { id, action, paymentMethod, ...updates } = parsed.data;
    const recurringList = (await dataAdapter.getRecurringSpends?.()) || [];
    const existing = recurringList.find((r: any) => r.id === id);

    if (!existing) {
      return NextResponse.json({ error: "Recurring commitment not found" }, { status: 404 });
    }

    if (action === "RECORD_PAID") {
      // 1. Record a genuine EXPENSE transaction
      const tx = {
        type: "EXPENSE",
        title: existing.name,
        amount: Number(existing.amount),
        category: existing.category || "Housing",
        description: `Recurring payment for ${existing.name}`,
        dueAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "COMPLETED",
        isRecurring: true,
        metadata: {
          recurringId: existing.id,
          paymentMethod: paymentMethod || "UPI",
          isRecurringPayment: true,
          description: `Recurring payment executed for ${existing.name}`,
        },
      };
      await dataAdapter.addEntry(tx);

      // 2. Advance nextDueDate based on frequency
      const curDue = existing.nextDueDate ? new Date(existing.nextDueDate) : new Date();
      const freq = existing.frequency || "MONTHLY";
      const nextDue = new Date(curDue);

      if (freq === "WEEKLY") {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (freq === "YEARLY") {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      } else {
        // MONTHLY default
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      const updated = await dataAdapter.updateRecurringSpend(id, {
        isPaid: true,
        nextDueDate: nextDue.toISOString(),
      });

      return NextResponse.json({
        success: true,
        recurringSpend: updated,
        recordedTransaction: tx,
        message: `Payment of ₹${existing.amount} recorded and schedule updated.`,
      });
    }

    // Normal updates
    const cleanUpdates: any = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.amount !== undefined) cleanUpdates.amount = updates.amount;
    if (updates.dayOfMonth !== undefined) cleanUpdates.dayOfMonth = updates.dayOfMonth;
    if (updates.category !== undefined) cleanUpdates.category = updates.category;
    if (updates.frequency !== undefined) cleanUpdates.frequency = updates.frequency;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.nextDueDate !== undefined) cleanUpdates.nextDueDate = updates.nextDueDate;
    if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
    if (updates.isPaid !== undefined) cleanUpdates.isPaid = updates.isPaid;

    const updated = await dataAdapter.updateRecurringSpend(id, cleanUpdates);
    return NextResponse.json({ success: true, recurringSpend: updated });
  } catch (error) {
    console.error("Update Recurring error:", error);
    return NextResponse.json({ error: "Failed to update recurring commitment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recurring commitment ID is required" }, { status: 400 });
    }

    const result = await dataAdapter.deleteRecurringSpend(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delete Recurring error:", error);
    return NextResponse.json({ error: "Failed to delete recurring commitment" }, { status: 500 });
  }
}
