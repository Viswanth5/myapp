import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseInput } from "@/lib/parser";

const CaptureRequestSchema = z.object({
  text: z.string().min(1, "Capture text cannot be empty"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CaptureRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await parseInput(parsed.data.text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Capture API error:", error);
    return NextResponse.json(
      { error: "Internal server error during capture parsing" },
      { status: 500 }
    );
  }
}
