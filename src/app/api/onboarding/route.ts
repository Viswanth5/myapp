import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dataAdapter } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const OnboardingSchema = z.object({
  // Step 1: Basic Profile & Focus
  name: z.string().min(1, "Full name is required"),
  preferredName: z.string().optional().default(""),
  userType: z.string().optional().default(""),
  occupation: z.string().optional().default(""),
  focusAreas: z.array(z.string()).optional().default([]),
  mainGoals: z.array(z.string()).optional().default([]),
  primaryFocus: z.string().optional().default("Overall Life Management"),
  educationDetails: z
    .object({
      institution: z.string().optional(),
      degreeBranch: z.string().optional(),
      yearSemester: z.string().optional(),
    })
    .optional(),
  semester: z.string().optional(),
  branch: z.string().optional(),
  college: z.string().optional(),
  personalPreferences: z
    .object({
      pace: z.string().optional(),
      reflection: z.string().optional(),
    })
    .optional(),

  // Step 2: Daily Life & Schedule
  wakeUpTime: z.string().optional().default("07:00"),
  sleepTime: z.string().optional().default("23:00"),
  workingHoursStart: z.string().optional().default("09:00"),
  workingHoursEnd: z.string().optional().default("18:00"),
  availableHoursPerDay: z.number().optional().default(8),
  quietHoursStart: z.string().optional().default("23:00"),
  quietHoursEnd: z.string().optional().default("07:00"),
  reminderPreference: z.string().optional().default("Balanced"),
  dailyRoutine: z.array(z.string()).optional().default([]),

  // Step 3: Financial Setup (Optional)
  startingBalance: z.number().nullable().optional(),
  monthlyIncome: z.number().nullable().optional(),
  currentSavings: z.number().nullable().optional(),
  monthlyBudget: z.number().nullable().optional(),
  financialGoals: z
    .array(
      z.object({
        title: z.string(),
        targetAmount: z.number(),
        category: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  bikeTravelExpenses: z.number().nullable().optional(),

  // Step 4: Tasks & Goals (Optional)
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        priority: z.enum(["HIGH", "MEDIUM", "NORMAL"]).optional().default("MEDIUM"),
        dueAt: z.string().nullable().optional(),
        isRecurring: z.boolean().optional().default(false),
        recurringFrequency: z.string().optional().default("NONE"),
        isPendingWork: z.boolean().optional().default(false),
      })
    )
    .optional()
    .default([]),
  goals: z
    .array(
      z.object({
        title: z.string().min(1),
        type: z.enum(["SHORT_TERM", "LONG_TERM"]).optional().default("SHORT_TERM"),
        category: z.string().optional().default("General"),
        targetValue: z.number().optional(),
        unit: z.string().optional(),
        deadline: z.string().nullable().optional(),
      })
    )
    .optional()
    .default([]),

  // Step 5: Habits & Fitness
  habits: z
    .array(
      z.object({
        name: z.string().min(1),
        frequencyDays: z.number().min(1).max(7).default(5),
        icon: z.string().optional().default("⚡"),
        color: z.string().optional().default("#E0A458"),
      })
    )
    .optional()
    .default([]),
  workoutTargetDays: z.number().optional().default(0),
  fitnessPreferences: z
    .object({
      workoutFocus: z.string().optional(),
      targetSleepHours: z.number().optional().default(7.5),
      waterIntakeLiters: z.number().optional().default(3.0),
      routineCadence: z.string().optional().default("Adaptive"),
    })
    .optional(),

  // Step 6: Personalize Your Dashboard
  firstView: z.string().optional().default("today"),
  isOnboarded: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      const fallbackUser = await dataAdapter.getUser();
      return NextResponse.json({
        isOnboarded: fallbackUser?.isOnboarded === true,
        draft: null,
        step: 1,
        user: {
          id: fallbackUser?.id || "guest",
          email: fallbackUser?.email || "",
          name: fallbackUser?.name || "",
          preferredName: fallbackUser?.preferredName || "",
        },
      });
    }

    const meta = authData.user.user_metadata || {};
    const isOnboarded = meta.isOnboarded === true;
    const draft = meta.onboardingDraft || null;
    const draftStep = draft?.step || 1;

    return NextResponse.json({
      isOnboarded,
      draft,
      step: draftStep,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: meta.name || draft?.name || "",
        preferredName: meta.preferredName || draft?.preferredName || "",
      },
    });
  } catch (error) {
    console.error("Onboarding GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve onboarding state" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Check Supabase authenticated user session
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;
    let supabase: any = null;

    try {
      supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
        authUserEmail = authData.user.email || null;
      }
    } catch (authErr) {
      console.warn("Supabase auth check failed:", authErr);
    }

    // Handle Progressive Draft Saving
    if (rawBody.isDraft) {
      const draftStep = typeof rawBody.step === "number" ? rawBody.step : 1;
      const draftData = {
        step: draftStep,
        name: rawBody.name || "",
        preferredName: rawBody.preferredName || "",
        userType: rawBody.userType || "",
        occupation: rawBody.occupation || "",
        focusAreas: rawBody.focusAreas || [],
        mainGoals: rawBody.mainGoals || [],
        primaryFocus: rawBody.primaryFocus || "",
        educationDetails: rawBody.educationDetails || {},
        semester: rawBody.semester || "",
        branch: rawBody.branch || "",
        college: rawBody.college || "",
        personalPreferences: rawBody.personalPreferences || {},
        wakeUpTime: rawBody.wakeUpTime,
        sleepTime: rawBody.sleepTime,
        workingHoursStart: rawBody.workingHoursStart,
        workingHoursEnd: rawBody.workingHoursEnd,
        availableHoursPerDay: rawBody.availableHoursPerDay,
        quietHoursStart: rawBody.quietHoursStart,
        quietHoursEnd: rawBody.quietHoursEnd,
        reminderPreference: rawBody.reminderPreference,
        dailyRoutine: rawBody.dailyRoutine || [],
        startingBalance: rawBody.startingBalance,
        monthlyIncome: rawBody.monthlyIncome,
        currentSavings: rawBody.currentSavings,
        monthlyBudget: rawBody.monthlyBudget,
        financialGoals: rawBody.financialGoals || [],
        bikeTravelExpenses: rawBody.bikeTravelExpenses,
        tasks: rawBody.tasks || [],
        goals: rawBody.goals || [],
        habits: rawBody.habits || [],
        workoutTargetDays: rawBody.workoutTargetDays,
        fitnessPreferences: rawBody.fitnessPreferences || {},
        firstView: rawBody.firstView || "today",
        updatedAt: new Date().toISOString(),
      };

      if (authUserId && supabase) {
        await supabase.auth.updateUser({
          data: {
            onboardingDraft: draftData,
            name: rawBody.name || undefined,
            preferredName: rawBody.preferredName || undefined,
          },
        });
      }

      return NextResponse.json({
        success: true,
        savedDraft: true,
        step: draftStep,
      });
    }

    const parsed = OnboardingSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid onboarding payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const collegeName = data.college || data.educationDetails?.institution || "";
    const branchName = data.branch || data.educationDetails?.degreeBranch || "";
    const semesterName = data.semester || data.educationDetails?.yearSemester || "";

    if (authUserId && supabase) {
      try {
        // Persist onboarding completion and settings to Supabase user metadata
        await supabase.auth.updateUser({
          data: {
            name: data.name,
            preferredName: data.preferredName,
            userType: data.userType,
            occupation: data.occupation,
            focusAreas: data.focusAreas,
            mainGoals: data.mainGoals,
            primaryFocus: data.primaryFocus,
            educationDetails: data.educationDetails,
            semester: semesterName,
            branch: branchName,
            college: collegeName,
            isOnboarded: true,
            onboardingDraft: null, // Clear draft upon completion
            firstView: data.firstView,
            onboardingCompletedAt: new Date().toISOString(),
            monthlyBudget: data.monthlyBudget || 0,
            startingBalance: data.startingBalance || 0,
            quietHoursStart: data.quietHoursStart,
            quietHoursEnd: data.quietHoursEnd,
          },
        });
      } catch (authErr) {
        console.warn("Supabase auth metadata update skipped/failed:", authErr);
      }
    }

    // 2. Persist to Prisma Database if connected
    if (authUserId) {
      try {
        await prisma.user.upsert({
          where: { id: authUserId },
          create: {
            id: authUserId,
            email: authUserEmail || `${authUserId}@user.local`,
            name: data.name,
            preferredName: data.preferredName || null,
            userType: data.userType || null,
            occupation: data.occupation || null,
            semester: semesterName,
            branch: branchName,
            college: collegeName,
            monthlyBudget: data.monthlyBudget || 0,
            startingBalance: data.startingBalance || 0,
            quietHoursStart: data.quietHoursStart,
            quietHoursEnd: data.quietHoursEnd,
            weeklyFreeHours: data.availableHoursPerDay * 5,
            isOnboarded: true,
          },
          update: {
            name: data.name,
            preferredName: data.preferredName || null,
            userType: data.userType || null,
            occupation: data.occupation || null,
            semester: semesterName,
            branch: branchName,
            college: collegeName,
            monthlyBudget: data.monthlyBudget || 0,
            startingBalance: data.startingBalance || 0,
            quietHoursStart: data.quietHoursStart,
            quietHoursEnd: data.quietHoursEnd,
            weeklyFreeHours: data.availableHoursPerDay * 5,
            isOnboarded: true,
          },
        });
      } catch (dbErr) {
        // Handled via memory adapter fallback
      }
    }

    // 3. Update Unified Data Adapter State
    const userId = authUserId || "user-default";

    // Set user profile
    await dataAdapter.setUserData({
      name: data.name,
      preferredName: data.preferredName,
      userType: data.userType,
      occupation: data.occupation,
      focusAreas: data.focusAreas,
      mainGoals: data.mainGoals,
      primaryFocus: data.primaryFocus,
      educationDetails: data.educationDetails,
      semester: semesterName,
      branch: branchName,
      college: collegeName,
      personalPreferences: data.personalPreferences,
      wakeUpTime: data.wakeUpTime,
      sleepTime: data.sleepTime,
      workingHoursStart: data.workingHoursStart,
      workingHoursEnd: data.workingHoursEnd,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      weeklyFreeHours: data.availableHoursPerDay * 5,
      monthlyBudget: data.monthlyBudget || 0,
      startingBalance: data.startingBalance || 0,
      monthlyIncome: data.monthlyIncome || 0,
      currentSavings: data.currentSavings || 0,
      fitnessPreferences: data.fitnessPreferences,
      workoutTargetDays: data.workoutTargetDays,
      firstView: data.firstView,
      isOnboarded: true,
    }, userId);

    // Save actual user tasks (no preloaded fake tasks!)
    const userEntries: any[] = [];

    if (data.tasks && data.tasks.length > 0) {
      data.tasks.forEach((t, i) => {
        userEntries.push({
          id: `task-${Date.now()}-${i}`,
          userId,
          type: "TASK",
          title: t.title,
          status: "PENDING",
          dueAt: t.dueAt || new Date(Date.now() + 8 * 3600000).toISOString(),
          effortMin: 45,
          weight: t.priority === "HIGH" ? 0.85 : t.priority === "MEDIUM" ? 0.6 : 0.4,
          priorityScore: t.priority === "HIGH" ? 85 : t.priority === "MEDIUM" ? 65 : 45,
          carriedCount: t.isPendingWork ? 1 : 0,
          snoozeCount: 0,
          metadata: {
            isRecurring: t.isRecurring,
            recurringFrequency: t.recurringFrequency,
            isPendingWork: t.isPendingWork,
          },
          createdAt: new Date().toISOString(),
        });
      });
    }

    // If starting balance was provided, create an initial transaction entry
    if (data.startingBalance && data.startingBalance > 0) {
      userEntries.push({
        id: `tx-init-${Date.now()}`,
        userId,
        type: "INCOME",
        title: "Starting Balance",
        amount: data.startingBalance,
        category: "Personal",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
      });
    }

    await dataAdapter.setTasks(userEntries, userId);

    // Save actual user habits (no fictional preloaded logs or streaks!)
    const userHabits: any[] = [];
    if (data.habits && data.habits.length > 0) {
      data.habits.forEach((h, i) => {
        userHabits.push({
          id: `habit-${Date.now()}-${i}`,
          userId,
          name: h.name,
          frequencyDays: h.frequencyDays,
          streakCount: 0, // Starts at 0
          graceDaysLeft: 2,
          monthlyGraceMax: 2,
          color: h.color || "#E0A458",
          icon: h.icon || "⚡",
          logs: [], // Empty logs — user builds their own history!
          createdAt: new Date().toISOString(),
        });
      });
    }
    await dataAdapter.setHabits(userHabits, userId);

    // Save actual user goals
    const userGoals: any[] = [];
    if (data.goals && data.goals.length > 0) {
      data.goals.forEach((g, i) => {
        userGoals.push({
          id: `goal-${Date.now()}-${i}`,
          userId,
          title: g.title,
          targetValue: g.targetValue || 100,
          currentValue: 0,
          unit: g.unit || "%",
          category: g.category || (g.type === "SHORT_TERM" ? "SHORT_TERM" : "LONG_TERM"),
          deadline: g.deadline ? new Date(g.deadline).toISOString() : null,
          color: "#38BDF8",
          createdAt: new Date().toISOString(),
        });
      });
    }

    // Add financial goals
    if (data.financialGoals && data.financialGoals.length > 0) {
      data.financialGoals.forEach((fg, i) => {
        userGoals.push({
          id: `fgoal-${Date.now()}-${i}`,
          userId,
          title: fg.title,
          targetValue: fg.targetAmount,
          currentValue: data.currentSavings || 0,
          unit: "INR",
          category: "SAVINGS",
          color: "#E0A458",
          createdAt: new Date().toISOString(),
        });
      });
    }
    await dataAdapter.setGoals(userGoals, userId);

    // Save recurring spends (e.g. bike & travel)
    const recurringSpends: any[] = [];
    if (data.bikeTravelExpenses && data.bikeTravelExpenses > 0) {
      recurringSpends.push({
        id: `rec-travel-${Date.now()}`,
        userId,
        name: "Bike & Travel Allowance",
        amount: data.bikeTravelExpenses,
        dayOfMonth: 1,
        category: "Travel",
        isPaid: false,
        createdAt: new Date().toISOString(),
      });
    }
    dataAdapter.setRecurringSpends(recurringSpends);

    const updatedUser = await dataAdapter.getUser();

    return NextResponse.json({
      success: true,
      user: updatedUser,
      summary: {
        tasksCount: userEntries.filter((e) => e.type === "TASK").length,
        habitsCount: userHabits.length,
        goalsCount: userGoals.length,
        hasFinances: Boolean(data.monthlyBudget || data.startingBalance),
      },
    });
  } catch (error) {
    console.error("Onboarding submission error:", error);
    return NextResponse.json(
      { error: "Failed to process onboarding setup" },
      { status: 500 }
    );
  }
}
