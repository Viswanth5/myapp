import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { generateExamStudyPlan, reflowStudyPlan } from "@/lib/engine/exam";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const courses = await dataAdapter.getCourses();
    const allEntries = await dataAdapter.getTodayEntries();

    const exams = allEntries.filter((e: any) => e.type === "EXAM");

    // Generate Exam Mode study plans for exams within 14 days
    const examPlans = exams
      .map((exam: any) =>
        generateExamStudyPlan({
          id: exam.id,
          title: exam.title,
          courseCode: exam.course?.code || "GEN",
          dueAt: exam.dueAt,
        })
      )
      .filter(Boolean);

    return NextResponse.json({
      courses,
      exams,
      examPlans,
    });
  } catch (error) {
    console.error("Study API error:", error);
    return NextResponse.json({ error: "Failed to load study data" }, { status: 500 });
  }
}

const ReflowPayloadSchema = z.object({
  plan: z.any(),
  missedDayNumber: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReflowPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reflow payload" }, { status: 400 });
    }

    const reflowed = reflowStudyPlan(parsed.data.plan, parsed.data.missedDayNumber);
    return NextResponse.json({ success: true, plan: reflowed });
  } catch (error) {
    console.error("Study plan reflow error:", error);
    return NextResponse.json({ error: "Failed to reflow study plan" }, { status: 500 });
  }
}
