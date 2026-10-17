import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding realistic test demo data...");

  // Clean existing data in reverse relational order
  try {
    await prisma.habitLog.deleteMany({});
    await prisma.entry.deleteMany({});
    await prisma.habit.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.recurringSpend.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.weeklyRewind.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err) {
    console.warn("Notice: Initial table clean skipped or tables empty:", err.message);
  }

  // 1. Create Default Demo User
  const user = await prisma.user.create({
    data: {
      id: "demo-user-1",
      email: "demo@vira.app",
      name: "Demo User",
      semester: "Semester 5",
      branch: "Computer Science & Engineering",
      college: "IIT Delhi / NIT",
      weeklyFreeHours: 28.0,
      monthlyBudget: 12000.0,
      startingBalance: 12000.0,
      currency: "INR",
      isOnboarded: true,
      quietHoursStart: "23:00",
      quietHoursEnd: "07:00",
    },
  });

  // 2. Create Courses
  const dbms = await prisma.course.create({
    data: {
      userId: user.id,
      code: "CS301",
      name: "Database Management Systems",
      color: "#1F6F6B",
      credits: 4,
      professor: "Prof. R. Raman",
    },
  });

  const os = await prisma.course.create({
    data: {
      userId: user.id,
      code: "CS302",
      name: "Operating Systems",
      color: "#E0A458",
      credits: 4,
      professor: "Prof. S. Banerjee",
    },
  });

  const cn = await prisma.course.create({
    data: {
      userId: user.id,
      code: "CS303",
      name: "Computer Networks",
      color: "#38BDF8",
      credits: 3,
      professor: "Prof. A. Mukherjee",
    },
  });

  const dsa = await prisma.course.create({
    data: {
      userId: user.id,
      code: "CS304",
      name: "Algorithms & Problem Solving",
      color: "#9E6482",
      credits: 4,
      professor: "Prof. P. Verma",
    },
  });

  // 3. Create Goals
  const laptopGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Save for M2 Laptop Upgrade",
      targetValue: 5000.0,
      currentValue: 3400.0,
      unit: "INR",
      category: "SAVINGS",
      deadline: new Date(Date.now() + 50 * 86400000),
      color: "#38BDF8",
    },
  });

  const gpaGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Achieve 8.8+ SGPA in Semester 5",
      targetValue: 8.8,
      currentValue: 8.4,
      unit: "CGPA",
      category: "ACADEMIC",
      deadline: new Date(Date.now() + 60 * 86400000),
      color: "#E0A458",
    },
  });

  // 4. Create Habits
  const gymHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Gym & Strength Training",
      frequencyDays: 3,
      streakCount: 8,
      graceDaysLeft: 2,
      color: "#E0A458",
    },
  });

  const leetcodeHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Daily LeetCode Problem",
      frequencyDays: 7,
      streakCount: 14,
      graceDaysLeft: 1,
      color: "#1F6F6B",
    },
  });

  const waterHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: "Drink 3L Water Daily",
      frequencyDays: 7,
      streakCount: 21,
      graceDaysLeft: 2,
      color: "#38BDF8",
    },
  });

  // Habit Logs for past 14 days
  const now = new Date();
  for (let i = 14; i >= 0; i--) {
    const logDate = new Date(now);
    logDate.setDate(logDate.getDate() - i);

    if (i % 2 === 0) {
      await prisma.habitLog.create({
        data: {
          habitId: gymHabit.id,
          date: logDate,
          completed: true,
          usedGrace: false,
        },
      });
    }

    await prisma.habitLog.create({
      data: {
        habitId: leetcodeHabit.id,
        date: logDate,
        completed: i !== 3,
        usedGrace: i === 3,
      },
    });

    await prisma.habitLog.create({
      data: {
        habitId: waterHabit.id,
        date: logDate,
        completed: true,
        usedGrace: false,
      },
    });
  }

  // 5. Recurring Spends (Indian Student Commitments)
  await prisma.recurringSpend.createMany({
    data: [
      { userId: user.id, name: "Hostel / Mess Advance", amount: 4200.0, dayOfMonth: 5, category: "Mess", isPaid: true },
      { userId: user.id, name: "5G Unlimited Recharge", amount: 349.0, dayOfMonth: 18, category: "Tech", isPaid: false },
      { userId: user.id, name: "Metro Smart Card Pass", amount: 600.0, dayOfMonth: 1, category: "Travel", isPaid: true },
      { userId: user.id, name: "Library / Xerox Fund", amount: 250.0, dayOfMonth: 22, category: "Academics", isPaid: false },
    ],
  });

  // 6. Entries (Tasks, Exams, Expenses, Events)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  const inTwoDays = new Date(now);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  inTwoDays.setHours(14, 0, 0, 0);

  const inSixDays = new Date(now);
  inSixDays.setDate(inSixDays.getDate() + 6);
  inSixDays.setHours(10, 0, 0, 0);

  const inElevenDays = new Date(now);
  inElevenDays.setDate(inElevenDays.getDate() + 11);
  inElevenDays.setHours(10, 0, 0, 0);

  await prisma.entry.createMany({
    data: [
      {
        userId: user.id,
        type: "TASK",
        title: "DBMS Assignment 3 (B+ Trees & Query Plans)",
        courseId: dbms.id,
        dueAt: tomorrow,
        effortMin: 90,
        weight: 0.7,
        status: "PENDING",
        priorityScore: 82,
        carriedCount: 0,
        goalId: gpaGoal.id,
      },
      {
        userId: user.id,
        type: "TASK",
        title: "Operating Systems Lab Record #4 (Banker's Algorithm)",
        courseId: os.id,
        dueAt: inTwoDays,
        effortMin: 120,
        weight: 0.65,
        status: "PENDING",
        priorityScore: 74,
        carriedCount: 1,
      },
      {
        userId: user.id,
        type: "TASK",
        title: "Networks Socket Programming Code Submission",
        courseId: cn.id,
        dueAt: inTwoDays,
        effortMin: 60,
        weight: 0.5,
        status: "PENDING",
        priorityScore: 68,
      },
      {
        userId: user.id,
        type: "TASK",
        title: "Print & Bind Physics Practical Manual",
        dueAt: tomorrow,
        effortMin: 20,
        weight: 0.2,
        status: "PENDING",
        priorityScore: 55,
      },
      {
        userId: user.id,
        type: "EXAM",
        title: "Database Management Systems Midsem Exam",
        courseId: dbms.id,
        dueAt: inSixDays,
        effortMin: 180,
        weight: 0.9,
        status: "PENDING",
        priorityScore: 92,
        goalId: gpaGoal.id,
      },
      {
        userId: user.id,
        type: "EXAM",
        title: "Operating Systems Midsem Exam",
        courseId: os.id,
        dueAt: inElevenDays,
        effortMin: 180,
        weight: 0.85,
        status: "PENDING",
        priorityScore: 80,
      },
      {
        userId: user.id,
        type: "EVENT",
        title: "Robotics Club Technical Workshop",
        startAt: new Date(Date.now() + 4 * 3600000),
        effortMin: 60,
        status: "PENDING",
      },
      {
        userId: user.id,
        type: "EXPENSE",
        title: "Canteen Lunch & Cold Coffee",
        amount: 180.0,
        category: "Food",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 2 * 3600000),
      },
      {
        userId: user.id,
        type: "EXPENSE",
        title: "Xerox Notes & Lab Assignment Sheets",
        amount: 350.0,
        category: "Academics",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 24 * 3600000),
      },
      {
        userId: user.id,
        type: "EXPENSE",
        title: "Metro Smart Card Recharge",
        amount: 200.0,
        category: "Travel",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 48 * 3600000),
      },
      {
        userId: user.id,
        type: "EXPENSE",
        title: "Hostel Mess Advance Part 1",
        amount: 3200.0,
        category: "Mess",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        userId: user.id,
        type: "INCOME",
        title: "Monthly Parental Allowance",
        amount: 12000.0,
        category: "Allowance",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
    ],
  });

  // 7. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "🌅 Morning Plan: 3 Focus Tasks",
        body: "DBMS Assignment 3 (due tmrw 5pm) is your top priority. Recommended 2:00 PM focus block.",
        type: "BATCHED_PLAN",
      },
      {
        userId: user.id,
        title: "⚡ Exam Mode Activated",
        body: "DBMS Midsem is in 6 days. Daily 2-hour syllabus chunks have been scheduled.",
        type: "EXAM_ALERT",
      },
    ],
  });

  // 8. Weekly Rewind
  await prisma.weeklyRewind.create({
    data: {
      userId: user.id,
      weekStartDate: new Date(Date.now() - 7 * 86400000),
      completedTasks: 14,
      carriedTasks: 2,
      totalSpent: 3930.0,
      habitsScore: 88.5,
      focusSuggestions: JSON.stringify([
        "Frontload OS Lab Record prep before Wednesday",
        "Keep daily canteen spend below ₹250 to preserve laptop savings",
        "Maintain your 14-day LeetCode streak using your remaining grace day",
      ]),
      summaryText: "Great momentum! You wrapped 14 submissions and kept high habit consistency.",
    },
  });

  console.log("✅ Supabase/Prisma Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
