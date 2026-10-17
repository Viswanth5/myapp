import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";

export const dynamic = "force-dynamic";

const UpdateBudgetSchema = z.object({
  monthlyBudget: z.number().nonnegative().optional(),
  startingBalance: z.number().nonnegative().optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  categoryBudgets: z.record(z.string(), z.number().nonnegative()).optional(),
  currency: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (parsed.data.monthlyBudget !== undefined) updates.monthlyBudget = parsed.data.monthlyBudget;
    if (parsed.data.startingBalance !== undefined) updates.startingBalance = parsed.data.startingBalance;
    if (parsed.data.monthlyIncome !== undefined) updates.monthlyIncome = parsed.data.monthlyIncome;
    if (parsed.data.categoryBudgets !== undefined) updates.categoryBudgets = parsed.data.categoryBudgets;
    if (parsed.data.currency !== undefined) updates.currency = parsed.data.currency;

    const user = await dataAdapter.setUserData(updates);

    return NextResponse.json({
      success: true,
      budget: {
        monthlyBudget: user.monthlyBudget,
        startingBalance: user.startingBalance,
        monthlyIncome: user.monthlyIncome,
        categoryBudgets: user.categoryBudgets,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Update Budget error:", error);
    return NextResponse.json({ error: "Failed to update financial budget settings" }, { status: 500 });
  }
}
