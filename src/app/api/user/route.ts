import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await dataAdapter.getUser();

    // Check if authenticated via Supabase and enrich user profile
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const meta = authData.user.user_metadata || {};
        if (meta.name !== undefined) user.name = meta.name;
        if (meta.preferredName !== undefined) user.preferredName = meta.preferredName;
        if (meta.userType !== undefined) user.userType = meta.userType;
        if (meta.occupation !== undefined) user.occupation = meta.occupation;
        if (meta.focusAreas !== undefined) user.focusAreas = meta.focusAreas;
        if (meta.mainGoals !== undefined) user.mainGoals = meta.mainGoals;
        if (meta.primaryFocus !== undefined) user.primaryFocus = meta.primaryFocus;
        if (meta.educationDetails !== undefined) user.educationDetails = meta.educationDetails;
        if (meta.semester !== undefined) user.semester = meta.semester;
        if (meta.branch !== undefined) user.branch = meta.branch;
        if (meta.college !== undefined) user.college = meta.college;
        if (meta.isOnboarded !== undefined) user.isOnboarded = meta.isOnboarded;
        if (meta.firstView !== undefined) user.firstView = meta.firstView;
        if (meta.monthlyBudget !== undefined) user.monthlyBudget = meta.monthlyBudget;
        if (meta.startingBalance !== undefined) user.startingBalance = meta.startingBalance;
        if (meta.quietHoursStart) user.quietHoursStart = meta.quietHoursStart;
        if (meta.quietHoursEnd) user.quietHoursEnd = meta.quietHoursEnd;
        user.email = authData.user.email || user.email;
        user.id = authData.user.id;
      }
    } catch {
      // In dev/offline mode
    }

    if (user.name && /^aarav(\s+sharma)?$/i.test(user.name)) user.name = "";
    if (user.preferredName && /^aarav(\s+sharma)?$/i.test(user.preferredName)) user.preferredName = "";
    if (user.college && /^iit delhi/i.test(user.college)) user.college = "";
    if (user.branch && /^computer science & engineering$/i.test(user.branch)) user.branch = "";
    if (user.semester && /^semester 5$/i.test(user.semester)) user.semester = "";

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

const UpdateUserSchema = z.object({
  name: z.string().optional(),
  preferredName: z.string().optional(),
  userType: z.string().optional(),
  occupation: z.string().optional(),
  semester: z.string().optional(),
  branch: z.string().optional(),
  college: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  mainGoals: z.array(z.string()).optional(),
  primaryFocus: z.string().optional(),
  educationDetails: z.record(z.any()).optional(),
  weeklyFreeHours: z.number().optional(),
  monthlyBudget: z.number().optional(),
  startingBalance: z.number().optional(),
  monthlyIncome: z.number().optional(),
  currentSavings: z.number().optional(),
  isOnboarded: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  wakeUpTime: z.string().optional(),
  sleepTime: z.string().optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  reminderPreference: z.string().optional(),
  firstView: z.string().optional(),
  habits: z.array(z.any()).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user update data" }, { status: 400 });
    }

    const user = await dataAdapter.getUser();
    Object.assign(user, parsed.data);

    // If habits were provided, update store habits
    if (parsed.data.habits && Array.isArray(parsed.data.habits)) {
      const existingHabits = await dataAdapter.getHabits();
      if (Array.isArray(existingHabits)) {
        parsed.data.habits.forEach((h: any) => {
          if (!existingHabits.some((eh: any) => eh.name === h.name)) {
            existingHabits.push({
              id: "habit-" + Date.now() + Math.random().toString(36).substring(2, 6),
              userId: user.id,
              name: h.name,
              frequencyDays: h.frequencyDays || 5,
              streakCount: 0,
              graceDaysLeft: 2,
              monthlyGraceMax: 2,
              color: h.color || "#E0A458",
              icon: h.icon || "⚡",
              logs: [],
            });
          }
        });
      }
    }

    // Also update Supabase auth metadata if authenticated
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          name: parsed.data.name !== undefined ? parsed.data.name : user.name,
          preferredName: parsed.data.preferredName !== undefined ? parsed.data.preferredName : user.preferredName,
          userType: parsed.data.userType !== undefined ? parsed.data.userType : user.userType,
          occupation: parsed.data.occupation !== undefined ? parsed.data.occupation : user.occupation,
          focusAreas: parsed.data.focusAreas !== undefined ? parsed.data.focusAreas : user.focusAreas,
          mainGoals: parsed.data.mainGoals !== undefined ? parsed.data.mainGoals : user.mainGoals,
          primaryFocus: parsed.data.primaryFocus !== undefined ? parsed.data.primaryFocus : user.primaryFocus,
          educationDetails: parsed.data.educationDetails !== undefined ? parsed.data.educationDetails : user.educationDetails,
          semester: parsed.data.semester !== undefined ? parsed.data.semester : user.semester,
          branch: parsed.data.branch !== undefined ? parsed.data.branch : user.branch,
          college: parsed.data.college !== undefined ? parsed.data.college : user.college,
          isOnboarded: parsed.data.isOnboarded ?? user.isOnboarded ?? true,
          firstView: parsed.data.firstView || user.firstView,
          monthlyBudget: parsed.data.monthlyBudget ?? user.monthlyBudget,
          startingBalance: parsed.data.startingBalance ?? user.startingBalance,
          quietHoursStart: parsed.data.quietHoursStart || user.quietHoursStart,
          quietHoursEnd: parsed.data.quietHoursEnd || user.quietHoursEnd,
        },
      });
    } catch (e) {
      // Non-blocking in case running in dev mode
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Update User error:", error);
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }
}
