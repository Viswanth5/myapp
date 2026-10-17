import { NextResponse } from "next/server";
import { dataAdapter } from "@/lib/data";
import { calculatePressureMeter } from "@/lib/engine/pressure";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await dataAdapter.getUser();
    const tasks = await dataAdapter.getTodayEntries();

    const pressure = calculatePressureMeter(
      tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt,
        effortMin: t.effortMin,
        type: t.type,
      })),
      user.weeklyFreeHours || 28.0
    );

    return NextResponse.json(pressure);
  } catch (error) {
    console.error("Pressure API error:", error);
    return NextResponse.json({ error: "Failed to calculate pressure meter" }, { status: 500 });
  }
}
