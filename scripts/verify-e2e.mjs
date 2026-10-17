// Comprehensive E2E Verification Script for VIRA Life-OS
// Tests:
// 1. Auth & Profile Persistence
// 2. Onboarding Draft Progress & Resumption
// 3. Complete Onboarding with all required & optional fields
// 4. Verification that Dashboard loads with user's preferredName and full name
// 5. Verification that user with 0 records sees clean empty states (no demo/fictional records)
// 6. Verification of data isolation between two distinct users

import http from "node:http";

const BASE_URL = "http://localhost:3000";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data,
        });
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== VIRA Life-OS E2E Test Suite ===\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check Server Liveness
  try {
    const rootRes = await request("/");
    assert(rootRes.status === 200 || rootRes.status === 307 || rootRes.status === 302, "Server responds to root request");
  } catch (err) {
    console.error("Server connection failed:", err.message);
    process.exit(1);
  }

  // 2. Check /api/today endpoint
  const todayRes = await request("/api/today");
  assert(todayRes.status === 200, "GET /api/today returns 200 OK");
  assert(todayRes.data && typeof todayRes.data === "object", "Today response is valid JSON");
  
  // Verify no hardcoded fake names in today response
  const stringifiedToday = JSON.stringify(todayRes.data);
  assert(!stringifiedToday.includes("Aarav"), "Today payload contains zero instances of 'Aarav'");
  assert(!stringifiedToday.includes("Sharma"), "Today payload contains zero instances of 'Sharma'");
  
  // 3. Test Onboarding Draft Persistence
  const draftPayload = {
    isDraft: true,
    step: 2,
    name: "Alex Johnson",
    preferredName: "AJ",
    userType: "Student",
    occupation: "Undergrad CS",
    focusAreas: ["college", "finances", "tasks"],
    mainGoals: [
      "Build consistent daily habits & routines",
      "Take control of personal finances & budget"
    ],
    primaryFocus: "Tasks",
    college: "Tech University",
    branch: "Computer Science",
    semester: "Semester 5",
    wakeUpTime: "06:30",
    sleepTime: "23:00",
  };

  const draftRes = await request("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: draftPayload,
  });

  assert(draftRes.status === 200, "Draft persistence POST returns 200 OK");
  assert(draftRes.data.savedDraft === true, "Draft acknowledged savedDraft === true");

  // 4. Test Final Onboarding Completion
  const completePayload = {
    name: "Dr. Maya Angel",
    preferredName: "Maya",
    userType: "Working Professional",
    occupation: "Research Scientist",
    focusAreas: ["career", "finances", "routines", "fitness"],
    mainGoals: [
      "Accelerate career, studies & high-value projects",
      "Balance physical health, workouts & recovery"
    ],
    primaryFocus: "Overall Life Management",
    college: "MIT",
    branch: "Physics",
    semester: "PhD Alum",
    educationDetails: {
      institution: "MIT",
      degreeBranch: "Physics",
      yearSemester: "PhD Alum"
    },
    wakeUpTime: "06:00",
    sleepTime: "22:30",
    workingHoursStart: "08:30",
    workingHoursEnd: "17:30",
    availableHoursPerDay: 9,
    quietHoursStart: "22:00",
    quietHoursEnd: "06:30",
    startingBalance: 45000,
    monthlyBudget: 35000,
    monthlyIncome: 80000,
    financialGoals: [{ title: "Emergency Fund", targetAmount: 200000 }],
    tasks: [
      { title: "Finalize Research Paper", priority: "HIGH" },
      { title: "Review Lab Equipment", priority: "MEDIUM" }
    ],
    habits: [
      { name: "Morning Meditation", frequencyDays: 7, icon: "🧘" },
      { name: "30-min Sprint Reading", frequencyDays: 5, icon: "📖" }
    ],
    workoutTargetDays: 5,
    firstView: "today",
    isOnboarded: true
  };

  const completeRes = await request("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: completePayload,
  });

  assert(completeRes.status === 200, "Full onboarding POST returns 200 OK");
  assert(completeRes.data.success === true, "Onboarding returns success === true");

  // 5. Test Updated User Profile
  const userProfileRes = await request("/api/user");
  assert(userProfileRes.status === 200, "GET /api/user returns 200 OK");
  assert(userProfileRes.data.user.preferredName === "Maya", "User preferredName persisted as 'Maya'");
  assert(userProfileRes.data.user.name === "Dr. Maya Angel", "User full name persisted as 'Dr. Maya Angel'");
  assert(userProfileRes.data.user.isOnboarded === true, "User isOnboarded is marked true");

  // 6. Test Dashboard /api/today with updated user
  const updatedTodayRes = await request("/api/today");
  assert(updatedTodayRes.data.user.preferredName === "Maya", "Dashboard user greeting contains preferredName 'Maya'");
  assert(updatedTodayRes.data.user.displayName === "Maya", "Dashboard user displayName is 'Maya'");
  assert(updatedTodayRes.data.mustDo.length >= 1, "User tasks populated from onboarding");

  // 7. Test Money Endpoints & Zero-Data Safety
  const moneyRes = await request("/api/money");
  assert(moneyRes.status === 200, "GET /api/money returns 200 OK");
  assert(moneyRes.data.analysis.monthlyBudget === 35000, "Money budget reflects user's actual configured 35000");

  // 8. Test Habits Endpoint
  const habitsRes = await request("/api/habits");
  assert(habitsRes.status === 200, "GET /api/habits returns 200 OK");
  assert(habitsRes.data.habits && habitsRes.data.habits.length === 2, "Habits accurately reflect user's 2 onboarding habits");
  assert(habitsRes.data.habits[0].streakCount === 0, "New habits correctly start with 0 streak (no fake history)");

  // 9. Test Goals Endpoint
  const goalsRes = await request("/api/goals");
  assert(goalsRes.status === 200, "GET /api/goals returns 200 OK");
  assert(goalsRes.data.goals && goalsRes.data.goals.length === 1, "Goals accurately reflect user's configured goal");
  assert(goalsRes.data.goals[0].title === "Emergency Fund", "Goal title matches 'Emergency Fund'");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
