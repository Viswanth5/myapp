import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { calculateMoneyRunway } from "@/lib/engine/money";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "THIS_MONTH") as any;

    const user = await dataAdapter.getUser();
    const transactions = await dataAdapter.getTransactions();
    const userRecurring = (await dataAdapter.getRecurringSpends?.()) || [];
    const goals = (await dataAdapter.getGoals?.()) || [];

    const formattedRecurring = userRecurring.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.amount) || 0,
      dueDay: Number(r.dayOfMonth) || 1,
      category: r.category || "General",
      frequency: r.frequency || "MONTHLY",
      status: r.status || "ACTIVE",
      nextDueDate: r.nextDueDate || null,
      notes: r.notes || "",
      isPaidThisMonth: Boolean(r.isPaid),
    }));

    const formattedTx = transactions.map((tx: any) => ({
      id: tx.id,
      amount: Number(tx.amount) || 0,
      type: tx.type as "EXPENSE" | "INCOME",
      category: tx.category || "General",
      subcategory: tx.metadata?.subcategory || null,
      title: tx.title,
      createdAt: tx.createdAt,
      dueAt: tx.dueAt || tx.createdAt,
      paymentMethod: tx.metadata?.paymentMethod || null,
      description: tx.description || tx.metadata?.description || null,
      metadata: tx.metadata || {},
    }));

    const analysis = calculateMoneyRunway(
      formattedTx,
      Number(user.monthlyBudget) || 0,
      formattedRecurring,
      {
        startingBalance: Number(user.startingBalance) || 0,
        categoryBudgets: user.categoryBudgets || {},
        goals,
        period,
      }
    );

    return NextResponse.json({
      analysis,
      transactions: formattedTx,
      user: {
        startingBalance: Number(user.startingBalance) || 0,
        monthlyBudget: Number(user.monthlyBudget) || 0,
        categoryBudgets: user.categoryBudgets || {},
        currency: user.currency || "INR",
        monthlyIncome: Number(user.monthlyIncome) || 0,
      },
      recurringSpends: userRecurring,
      goals,
    });
  } catch (error) {
    console.error("Money API GET error:", error);
    return NextResponse.json({ error: "Failed to load financial records" }, { status: 500 });
  }
}

const AddTransactionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  type: z.enum(["EXPENSE", "INCOME"]),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  linkedGoalId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const {
      title,
      amount,
      type,
      category,
      subcategory,
      date,
      paymentMethod,
      notes,
      isRecurring,
      recurringFrequency,
      linkedGoalId,
    } = parsed.data;

    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const transaction = {
      type,
      title,
      amount,
      category: category || (type === "INCOME" ? "Salary" : "Personal"),
      description: notes || "",
      dueAt: txDate,
      createdAt: txDate,
      status: "COMPLETED",
      isRecurring: Boolean(isRecurring),
      recurringFrequency: recurringFrequency || "NONE",
      goalId: linkedGoalId || null,
      metadata: {
        subcategory: subcategory || null,
        paymentMethod: paymentMethod || "UPI",
        linkedGoalId: linkedGoalId || null,
        description: notes || "",
        isRecurring: Boolean(isRecurring),
        recurringFrequency: recurringFrequency || "NONE",
      },
    };

    const created = await dataAdapter.addEntry(transaction);

    // If linked to a savings goal and this is recorded, update goal's currentValue
    if (linkedGoalId) {
      const goals = (await dataAdapter.getGoals?.()) || [];
      const targetGoal = goals.find((g: any) => g.id === linkedGoalId);
      if (targetGoal) {
        const updatedVal = (Number(targetGoal.currentValue) || 0) + amount;
        await dataAdapter.updateGoal?.(linkedGoalId, { currentValue: updatedVal });
      }
    }

    return NextResponse.json({ success: true, transaction: created });
  } catch (error) {
    console.error("Money API POST error:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}

const EditTransactionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["EXPENSE", "INCOME"]).optional(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  linkedGoalId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EditTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { id, title, amount, type, category, subcategory, date, paymentMethod, notes, isRecurring, recurringFrequency, linkedGoalId } = parsed.data;

    const payload: any = {};
    if (title !== undefined) payload.title = title;
    if (amount !== undefined) payload.amount = amount;
    if (type !== undefined) payload.type = type;
    if (category !== undefined) payload.category = category;
    if (notes !== undefined) {
      payload.description = notes;
    }
    if (date !== undefined && date !== null) {
      payload.dueAt = new Date(date).toISOString();
    }
    if (isRecurring !== undefined) payload.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) payload.recurringFrequency = recurringFrequency;

    payload.metadata = {
      ...(subcategory !== undefined ? { subcategory } : {}),
      ...(paymentMethod !== undefined ? { paymentMethod } : {}),
      ...(linkedGoalId !== undefined ? { linkedGoalId } : {}),
      ...(notes !== undefined ? { description: notes } : {}),
    };

    const updated = await dataAdapter.patchEntry(id, "EDIT", payload);
    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error("Money API PATCH error:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const result = await dataAdapter.patchEntry(id, "DELETE");
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Money API DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
