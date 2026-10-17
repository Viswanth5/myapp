import { NextResponse } from "next/server";
import { dataAdapter } from "@/lib/data";
import { generateICS, CalendarEventExport } from "@/lib/engine/ics";

export async function GET() {
  try {
    const entries = await dataAdapter.getEntries();
    
    const calendarEvents: CalendarEventExport[] = entries
      .filter((e: any) => e.dueAt || e.type === "EXAM" || e.type === "EVENT")
      .map((e: any) => {
        const start = e.dueAt ? new Date(e.dueAt) : new Date();
        const end = new Date(start.getTime() + (e.effortMin || 60) * 60000);
        return {
          id: e.id,
          title: `[${e.type}] ${e.title}`,
          description: `Course: ${e.course || "General"} | Estimated Effort: ${e.effortMin || 30}m | Created via Orbit`,
          startAt: start,
          endAt: end,
          location: "Campus / Study Desk",
        };
      });

    const icsContent = generateICS(calendarEvents);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="orbit-schedule-${new Date().toISOString().slice(0, 10)}.ics"`,
      },
    });
  } catch (error) {
    console.error("Calendar export failed:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar export" },
      { status: 500 }
    );
  }
}
