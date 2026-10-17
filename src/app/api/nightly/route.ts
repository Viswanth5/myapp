import { NextResponse } from "next/server";
import { dataAdapter } from "@/lib/data";
import { autoRolloverTasks } from "@/lib/engine/rollover";

export async function POST() {
  try {
    const entries = await dataAdapter.getEntries();
    const tasks = entries.filter((e: any) => e.type === "TASK" || e.type === "EXAM");
    
    // Process midnight rollover logic
    const { rolledTasks, triageNeeded } = autoRolloverTasks(tasks);

    return NextResponse.json({
      success: true,
      message: `Nightly rollover executed. ${rolledTasks.length} tasks evaluated.`,
      rolledTasks,
      triageNeeded,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Nightly job failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run nightly job" },
      { status: 500 }
    );
  }
}
