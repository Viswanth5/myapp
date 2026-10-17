import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { calculateBikeAnalytics } from "@/lib/engine/bike";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = (await dataAdapter.getBikeLogs?.()) || [];
    const analytics = calculateBikeAnalytics(logs);

    return NextResponse.json({
      logs,
      analytics,
    });
  } catch (error) {
    console.error("Bike Logs GET error:", error);
    return NextResponse.json({ error: "Failed to load bike and travel logs" }, { status: 500 });
  }
}

const AddBikeLogSchema = z.object({
  bikeName: z.string().optional().default("My Bike"),
  type: z.enum(["FUEL", "SERVICE", "EXPENSE"]).optional().default("FUEL"),
  litres: z.number().positive().optional().nullable(),
  fuelPricePerLitre: z.number().positive().optional().nullable(),
  amount: z.number().positive("Amount paid must be greater than zero"),
  odometer: z.number().nonnegative().optional().nullable(),
  distance: z.number().positive().optional().nullable(),
  serviceType: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  recordAsExpense: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AddBikeLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const {
      bikeName,
      type,
      litres,
      fuelPricePerLitre,
      amount,
      odometer,
      distance,
      serviceType,
      date,
      notes,
      recordAsExpense,
    } = parsed.data;

    const logDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const newLog = await dataAdapter.addBikeLog({
      bikeName: bikeName || "My Bike",
      type,
      litres: litres || null,
      fuelPricePerLitre: fuelPricePerLitre || null,
      amount,
      odometer: odometer || null,
      distance: distance || null,
      serviceType: serviceType || null,
      date: logDate,
      notes: notes || "",
    });

    // Optionally record as an EXPENSE entry under "Transport"
    if (recordAsExpense) {
      const typeLabel = type === "FUEL" ? "Fuel Refill" : type === "SERVICE" ? "Bike Service" : "Travel Expense";
      const tx = {
        type: "EXPENSE",
        title: `${typeLabel} — ${bikeName || "My Bike"}`,
        amount,
        category: "Transport",
        description: notes || `${typeLabel} recorded via Bike Tracker`,
        dueAt: logDate,
        createdAt: logDate,
        status: "COMPLETED",
        metadata: {
          isBikeExpense: true,
          bikeLogId: newLog.id,
          bikeName,
          type,
          odometer,
          litres,
          paymentMethod: "UPI",
        },
      };
      await dataAdapter.addEntry(tx);
    }

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error("Add Bike Log error:", error);
    return NextResponse.json({ error: "Failed to record bike log" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const result = await dataAdapter.deleteBikeLog(id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Delete Bike Log error:", error);
    return NextResponse.json({ error: "Failed to delete bike log" }, { status: 500 });
  }
}
