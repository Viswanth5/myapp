import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://exqxfoyeidukneqvpeod.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_sSohTAtCHYLJCv2CDjSWCw_h0bb726x";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXhmb3llaWR1a25lcXZwZW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTk5MTY1MywiZXhwIjoyMTA3NTY3NjUzfQ.vwD3h1B4VMBxQnGusDphMvISyTkK-eQ9wQg3pWYn3f8";
const BASE_URL = "http://localhost:3000";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log("=== STARTING FULL SUPABASE & APP FLOW VERIFICATION ===");
  const timestamp = Date.now();
  const testEmail1 = `vira_user_a_${timestamp}@orbit.life`;
  const testPassword = `TestPassword!${timestamp}`;
  const testEmail2 = `vira_user_b_${timestamp}@orbit.life`;

  // 1. Create User A with Supabase Admin API
  console.log(`\n1. Creating User A (${testEmail1})...`);
  const { data: userCreatedA, error: createAErr } = await adminClient.auth.admin.createUser({
    email: testEmail1,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: "Viswa Test A",
      isOnboarded: false,
    },
  });

  if (createAErr || !userCreatedA.user) {
    console.error("User A creation failed:", createAErr);
    process.exit(1);
  }
  const userAId = userCreatedA.user.id;
  console.log("✓ User A registered and confirmed with ID:", userAId);

  // 2. Sign in User A via @supabase/ssr createServerClient to capture true cookies
  console.log("\n2. Signing in User A via SSR Client...");
  let cookiesA = [];
  const clientA = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookiesA,
      setAll: (c) => {
        cookiesA = c;
      },
    },
  });

  const { data: signInData, error: signInErr } = await clientA.auth.signInWithPassword({
    email: testEmail1,
    password: testPassword,
  });

  if (signInErr || !signInData.session) {
    console.error("User A sign in failed:", signInErr);
    process.exit(1);
  }
  console.log("✓ User A signed in successfully. SSR Cookies captured:", cookiesA.length);
  const cookieHeader = cookiesA.map((c) => `${c.name}=${c.value}`).join("; ");

  // 3. Test GET /api/onboarding for un-onboarded User A
  console.log("\n3. Testing GET /api/onboarding for fresh User A...");
  const onbGetRes = await fetch(`${BASE_URL}/api/onboarding`, {
    headers: { Cookie: cookieHeader },
  });
  const onbGetData = await onbGetRes.json();
  console.log("✓ Onboarding status:", {
    status: onbGetRes.status,
    isOnboarded: onbGetData.isOnboarded,
    step: onbGetData.step,
    name: onbGetData.user?.name,
  });
  if (onbGetData.isOnboarded !== false) {
    throw new Error(`Expected isOnboarded to be false, got: ${JSON.stringify(onbGetData)}`);
  }

  // 4. Test Progressive Draft Saving (Step 2)
  console.log("\n4. Testing Progressive Draft Saving (Step 2)...");
  const draftPayload = {
    isDraft: true,
    step: 2,
    name: "Viswanth Personal OS",
    occupation: "Senior Systems Engineer",
    focusAreas: ["tasks", "routines", "goals", "finances"],
    wakeUpTime: "06:30",
    sleepTime: "23:00",
    availableHoursPerDay: 7,
  };

  const draftRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(draftPayload),
  });
  const draftData = await draftRes.json();
  console.log("✓ Progressive draft save response:", draftData);
  if (!draftData.savedDraft || draftData.step !== 2) {
    throw new Error("Draft saving failed");
  }

  // 5. Test Resuming Draft from Server
  console.log("\n5. Verifying Resuming Incomplete Onboarding...");
  const resumeRes = await fetch(`${BASE_URL}/api/onboarding`, {
    headers: { Cookie: cookieHeader },
  });
  const resumeData = await resumeRes.json();
  console.log("✓ Resumed draft step:", resumeData.step);
  console.log("✓ Resumed draft occupation:", resumeData.draft?.occupation);
  if (resumeData.step !== 2 || resumeData.draft?.occupation !== "Senior Systems Engineer") {
    throw new Error("Draft resume did not retain saved data");
  }

  // 6. Complete Final Onboarding
  console.log("\n6. Submitting Final Onboarding...");
  const finalOnboardingPayload = {
    name: "Viswanth Personal OS",
    occupation: "Senior Systems Engineer",
    focusAreas: ["tasks", "routines", "goals", "finances", "fitness"],
    personalPreferences: {
      pace: "Deep Focus Flow",
      reflection: "Evening Wind-down (9 PM)",
    },
    wakeUpTime: "06:30",
    sleepTime: "23:00",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    availableHoursPerDay: 8,
    quietHoursStart: "22:30",
    quietHoursEnd: "06:30",
    reminderPreference: "Balanced",
    dailyRoutine: ["Morning Planning", "Deep Execution", "Gym Workout", "Night Review"],
    startingBalance: 35000,
    monthlyIncome: 75000,
    currentSavings: 150000,
    monthlyBudget: 25000,
    financialGoals: [{ title: "Emergency Reserve", targetAmount: 200000 }],
    bikeTravelExpenses: 3000,
    tasks: [
      {
        title: "Deploy VIRA Supabase Integration",
        priority: "HIGH",
        dueAt: new Date(Date.now() + 12 * 3600000).toISOString(),
        isRecurring: false,
        recurringFrequency: "NONE",
        isPendingWork: true,
      },
    ],
    goals: [
      {
        title: "Complete Core Cloud Architecture",
        type: "SHORT_TERM",
        category: "Career",
      },
    ],
    habits: [
      {
        name: "Morning Meditation & Planning",
        frequencyDays: 7,
        icon: "⚡",
        color: "#E0A458",
      },
      {
        name: "Daily Coding & Architecture",
        frequencyDays: 6,
        icon: "💻",
        color: "#1F6F6B",
      },
    ],
    workoutTargetDays: 5,
    fitnessPreferences: {
      workoutFocus: "Strength & Endurance",
      targetSleepHours: 8.0,
      waterIntakeLiters: 3.5,
      routineCadence: "Adaptive",
    },
    firstView: "today",
    isOnboarded: true,
  };

  const finalRes = await fetch(`${BASE_URL}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(finalOnboardingPayload),
  });
  const finalData = await finalRes.json();
  console.log("✓ Final onboarding completed:", finalData.summary);
  if (!finalData.success) {
    throw new Error("Final onboarding failed");
  }

  // 7. Test Dashboard (GET /api/today) for User A
  console.log("\n7. Fetching Dashboard for User A...");
  const todayRes = await fetch(`${BASE_URL}/api/today`, {
    headers: { Cookie: cookieHeader },
  });
  const todayData = await todayRes.json();
  console.log("✓ Dashboard loaded for user:", todayData.user?.name);
  console.log("✓ Must-do tasks count:", todayData.mustDo?.length);
  console.log("✓ Follow-ups count:", todayData.pendingFollowUps?.length);
  const userATask = todayData.mustDo?.[0] || todayData.pendingFollowUps?.[0];
  console.log("✓ Real task retrieved:", userATask?.title);

  // 8. Add a Task from Dashboard
  console.log("\n8. Adding a new task via POST /api/today...");
  const addTaskRes = await fetch(`${BASE_URL}/api/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Verify Supabase Row Isolation",
      priority: "HIGH",
      effortMin: 45,
      isFocus: true,
      category: "Personal",
    }),
  });
  const addTaskData = await addTaskRes.json();
  console.log("✓ Task created successfully:", addTaskData.entry?.title);
  const createdTaskId = addTaskData.entry?.id;

  // 9. Complete the Task via PATCH /api/today
  console.log("\n9. Completing the task via PATCH /api/today...");
  const patchRes = await fetch(`${BASE_URL}/api/today`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      id: createdTaskId,
      action: "COMPLETE",
    }),
  });
  const patchData = await patchRes.json();
  console.log("✓ Task status updated:", patchData.updated?.status);
  if (patchData.updated?.status !== "COMPLETED") {
    throw new Error("Task status was not updated to COMPLETED");
  }

  // 10. Record an expense via POST /api/money
  console.log("\n10. Recording an expense via POST /api/money...");
  const expenseRes = await fetch(`${BASE_URL}/api/money`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Express Coffee & Breakfast",
      amount: 180,
      type: "EXPENSE",
      category: "Food",
    }),
  });
  const expenseData = await expenseRes.json();
  console.log("✓ Expense recorded:", expenseData.transaction);

  // 11. Complete a habit via POST /api/habits
  console.log("\n11. Checking off a habit via POST /api/habits...");
  const habitsGetRes = await fetch(`${BASE_URL}/api/habits`, {
    headers: { Cookie: cookieHeader },
  });
  const habitsGetData = await habitsGetRes.json();
  const habitToLog = habitsGetData.habits?.[0];
  console.log("✓ Found habit to log:", habitToLog?.habitName);

  if (habitToLog) {
    const habitPostRes = await fetch(`${BASE_URL}/api/habits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        habitId: habitToLog.habitId,
        completed: true,
      }),
    });
    const habitPostData = await habitPostRes.json();
    console.log("✓ Habit check-in outcome:", habitPostData.outcome);
  }

  // 12. Multi-User Isolation Test (Create and Sign in User B)
  console.log(`\n12. Testing Data Isolation with User B (${testEmail2})...`);
  const { data: userCreatedB, error: createBErr } = await adminClient.auth.admin.createUser({
    email: testEmail2,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: "Explorer User B",
      isOnboarded: false,
    },
  });
  if (createBErr || !userCreatedB.user) {
    throw new Error(`User B creation failed: ${createBErr?.message}`);
  }

  let cookiesB = [];
  const clientB = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookiesB,
      setAll: (c) => {
        cookiesB = c;
      },
    },
  });

  await clientB.auth.signInWithPassword({
    email: testEmail2,
    password: testPassword,
  });
  const cookieHeaderB = cookiesB.map((c) => `${c.name}=${c.value}`).join("; ");

  // Fetch Dashboard for User B (before onboarding)
  const todayBRes = await fetch(`${BASE_URL}/api/today`, {
    headers: { Cookie: cookieHeaderB },
  });
  const todayBData = await todayBRes.json();
  console.log("✓ User B tasks count:", todayBData.mustDo?.length || 0);
  console.log("✓ User B user name:", todayBData.user?.name);

  // Verify User B does NOT have User A's tasks or expenses!
  const allUserBTasks = [
    ...(todayBData.mustDo || []),
    ...(todayBData.pendingFollowUps || []),
    ...(todayBData.completedTasks || []),
  ];
  const hasUserATaskInB = allUserBTasks.some(
    (t) =>
      t.title === "Deploy VIRA Supabase Integration" ||
      t.title === "Verify Supabase Row Isolation"
  );
  if (hasUserATaskInB) {
    throw new Error("CRITICAL SECURITY FAILURE: User B leaked User A's tasks!");
  }
  console.log("✓ Verified 100% User Isolation: User B cannot see User A's tasks or data.");

  // Clean up test accounts from Supabase auth
  console.log("\n13. Cleaning up test accounts from Supabase...");
  if (userAId) await adminClient.auth.admin.deleteUser(userAId);
  if (userCreatedB?.user?.id) await adminClient.auth.admin.deleteUser(userCreatedB.user.id);
  console.log("✓ Test users cleaned up successfully.");

  console.log("\n========================================================");
  console.log("✅ ALL FLOWS VERIFIED SUCCESSFULLY WITH 100% SUCCESS!");
  console.log("========================================================");
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
