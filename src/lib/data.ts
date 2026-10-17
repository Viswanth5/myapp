// Unified Data Adapter: Supports live Supabase Auth cloud storage, multi-user isolation, and Prisma PostgreSQL
import { prisma } from "@/lib/db";
import { PriorityInput } from "@/lib/engine/priority";
import { calculateHabitStreak } from "@/lib/engine/habits";

export interface DemoStore {
  user: any;
  courses: any[];
  entries: any[];
  habits: any[];
  goals: any[];
  recurringSpends: any[];
  notifications: any[];
  rewinds: any[];
  bikeLogs: any[];
}

export interface UserPartition {
  user: any;
  entries: any[];
  habits: any[];
  goals: any[];
  recurringSpends: any[];
  courses: any[];
  bikeLogs: any[];
}

declare global {
  // eslint-disable-next-line no-var
  var orbitDataStore: DemoStore | undefined;
  // eslint-disable-next-line no-var
  var orbitUserStores: Record<string, UserPartition> | undefined;
}

// In-Memory Fallback Store (Clean slate without preloaded fictional data)
const initialStore: DemoStore = {
  user: {
    id: "user-default",
    email: "",
    name: "",
    preferredName: "",
    userType: "",
    occupation: "",
    semester: "",
    branch: "",
    college: "",
    weeklyFreeHours: 28.0,
    monthlyBudget: 0,
    startingBalance: 0,
    monthlyIncome: 0,
    currentSavings: 0,
    currency: "INR",
    isOnboarded: false,
    quietHoursStart: "23:00",
    quietHoursEnd: "07:00",
    wakeUpTime: "07:00",
    sleepTime: "23:00",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    focusAreas: [],
    mainGoals: [],
    primaryFocus: "",
    educationDetails: {},
    preferences: {},
    fitnessPreferences: {},
    workoutTargetDays: 0,
    completedWorkoutsThisWeek: 0,
    lastCheckInDate: "",
    categoryBudgets: {},
  },
  courses: [],
  entries: [],
  habits: [],
  goals: [],
  recurringSpends: [],
  notifications: [],
  rewinds: [],
  bikeLogs: [],
};

export const demoStore: DemoStore = global.orbitDataStore || initialStore;
global.orbitDataStore = demoStore;

export const userStores: Record<string, UserPartition> = global.orbitUserStores || {};
global.orbitUserStores = userStores;

// Safely get authenticated user session from server request cookies
export async function getAuthenticatedUser() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

// Sync user-specific data to Supabase Auth cloud storage
export async function syncUserToSupabase(userId: string, updates: Record<string, any>) {
  if (!userId || userId === "user-default") return;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: existingUser } = await admin.auth.admin.getUserById(userId);
    const existingMeta = existingUser?.user?.user_metadata || {};
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        ...updates,
      },
    });
  } catch (err) {
    console.warn("Failed to sync user data to Supabase:", err);
  }
}

// Helper to get formatted display name for greeting & headers
export function getUserDisplayName(user: any): string {
  if (!user) return "";
  const preferred = typeof user.preferredName === "string" ? user.preferredName.trim() : "";
  if (preferred && !/^aarav(\s+sharma)?$/i.test(preferred)) return preferred;
  const fullName = typeof user.name === "string" ? user.name.trim() : "";
  if (fullName && !/^aarav(\s+sharma)?$/i.test(fullName)) return fullName;
  return "";
}

// Retrieve or initialize an isolated user partition
export function getUserPartition(userId: string, metadata?: any, email?: string): UserPartition {
  const sanitizeStr = (val: any, legacyBlock: RegExp) => {
    if (typeof val !== "string") return "";
    const trimmed = val.trim();
    return legacyBlock.test(trimmed) ? "" : trimmed;
  };

  if (!userStores[userId]) {
    const rawName = sanitizeStr(metadata?.name, /^aarav(\s+sharma)?$/i);
    const rawPref = sanitizeStr(metadata?.preferredName, /^aarav(\s+sharma)?$/i);
    const rawCollege = sanitizeStr(metadata?.college, /^iit delhi/i);
    const rawBranch = sanitizeStr(metadata?.branch, /^computer science & engineering$/i);
    const rawSem = sanitizeStr(metadata?.semester, /^semester 5$/i);

    userStores[userId] = {
      user: {
        id: userId,
        email: email || metadata?.email || "",
        name: rawName,
        preferredName: rawPref,
        userType: metadata?.userType || "",
        occupation: metadata?.occupation || "",
        semester: rawSem,
        branch: rawBranch,
        college: rawCollege,
        weeklyFreeHours: metadata?.weeklyFreeHours || 28.0,
        monthlyBudget: metadata?.monthlyBudget || 0,
        startingBalance: metadata?.startingBalance || 0,
        monthlyIncome: metadata?.monthlyIncome || 0,
        currentSavings: metadata?.currentSavings || 0,
        currency: "INR",
        isOnboarded: metadata?.isOnboarded === true,
        quietHoursStart: metadata?.quietHoursStart || "23:00",
        quietHoursEnd: metadata?.quietHoursEnd || "07:00",
        wakeUpTime: metadata?.wakeUpTime || "07:00",
        sleepTime: metadata?.sleepTime || "23:00",
        workingHoursStart: metadata?.workingHoursStart || "09:00",
        workingHoursEnd: metadata?.workingHoursEnd || "18:00",
        focusAreas: Array.isArray(metadata?.focusAreas) ? metadata.focusAreas : [],
        mainGoals: Array.isArray(metadata?.mainGoals) ? metadata.mainGoals : [],
        primaryFocus: metadata?.primaryFocus || "",
        educationDetails: metadata?.educationDetails || {},
        preferences: metadata?.preferences || {},
        fitnessPreferences: metadata?.fitnessPreferences || {},
        workoutTargetDays: metadata?.workoutTargetDays || 0,
        completedWorkoutsThisWeek: metadata?.completedWorkoutsThisWeek || 0,
        lastCheckInDate: metadata?.lastCheckInDate || "",
        categoryBudgets: metadata?.categoryBudgets || {},
      },
      entries: Array.isArray(metadata?.entries) ? metadata.entries : [],
      habits: Array.isArray(metadata?.habits) ? metadata.habits : [],
      goals: Array.isArray(metadata?.goals) ? metadata.goals : [],
      recurringSpends: Array.isArray(metadata?.recurringSpends) ? metadata.recurringSpends : [],
      courses: Array.isArray(metadata?.courses) ? metadata.courses : [],
      bikeLogs: Array.isArray(metadata?.bikeLogs) ? metadata.bikeLogs : [],
    };
  } else if (metadata) {
    const u = userStores[userId].user;
    if (metadata.name !== undefined) {
      const clean = sanitizeStr(metadata.name, /^aarav(\s+sharma)?$/i);
      if (clean || metadata.name === "") u.name = clean;
    }
    if (metadata.preferredName !== undefined) {
      const clean = sanitizeStr(metadata.preferredName, /^aarav(\s+sharma)?$/i);
      if (clean || metadata.preferredName === "") u.preferredName = clean;
    }
    if (metadata.userType !== undefined) u.userType = metadata.userType;
    if (metadata.occupation !== undefined) u.occupation = metadata.occupation;
    if (metadata.semester !== undefined) u.semester = sanitizeStr(metadata.semester, /^semester 5$/i);
    if (metadata.branch !== undefined) u.branch = sanitizeStr(metadata.branch, /^computer science & engineering$/i);
    if (metadata.college !== undefined) u.college = sanitizeStr(metadata.college, /^iit delhi/i);
    if (metadata.isOnboarded !== undefined) u.isOnboarded = metadata.isOnboarded === true;
    if (metadata.focusAreas !== undefined) u.focusAreas = metadata.focusAreas;
    if (metadata.mainGoals !== undefined) u.mainGoals = metadata.mainGoals;
    if (metadata.primaryFocus !== undefined) u.primaryFocus = metadata.primaryFocus;
    if (metadata.educationDetails !== undefined) u.educationDetails = metadata.educationDetails;
    if (metadata.monthlyBudget !== undefined) u.monthlyBudget = metadata.monthlyBudget;
    if (metadata.startingBalance !== undefined) u.startingBalance = metadata.startingBalance;
    if (metadata.monthlyIncome !== undefined) u.monthlyIncome = metadata.monthlyIncome;
    if (metadata.currentSavings !== undefined) u.currentSavings = metadata.currentSavings;
    if (metadata.categoryBudgets !== undefined) u.categoryBudgets = metadata.categoryBudgets;
    if (metadata.workoutTargetDays !== undefined) u.workoutTargetDays = metadata.workoutTargetDays;
    if (metadata.completedWorkoutsThisWeek !== undefined) u.completedWorkoutsThisWeek = metadata.completedWorkoutsThisWeek;
    if (metadata.lastCheckInDate !== undefined) u.lastCheckInDate = metadata.lastCheckInDate;
    if (metadata.quietHoursStart !== undefined) u.quietHoursStart = metadata.quietHoursStart;
    if (metadata.quietHoursEnd !== undefined) u.quietHoursEnd = metadata.quietHoursEnd;

    if (Array.isArray(metadata.entries) && userStores[userId].entries.length === 0) {
      userStores[userId].entries = metadata.entries;
    }
    if (Array.isArray(metadata.habits) && userStores[userId].habits.length === 0) {
      userStores[userId].habits = metadata.habits;
    }
    if (Array.isArray(metadata.goals) && userStores[userId].goals.length === 0) {
      userStores[userId].goals = metadata.goals;
    }
    if (Array.isArray(metadata.bikeLogs) && (!userStores[userId].bikeLogs || userStores[userId].bikeLogs.length === 0)) {
      userStores[userId].bikeLogs = metadata.bikeLogs;
    }
    if (Array.isArray(metadata.recurringSpends) && (!userStores[userId].recurringSpends || userStores[userId].recurringSpends.length === 0)) {
      userStores[userId].recurringSpends = metadata.recurringSpends;
    }
  }

  return userStores[userId];
}

export const dataAdapter = {
  getDemoStore: () => demoStore,

  // Get User Profile (user-specific when authenticated)
  getUser: async (explicitUserId?: string) => {
    let authUser: any = null;
    if (explicitUserId) {
      authUser = { id: explicitUserId };
    } else {
      authUser = await getAuthenticatedUser();
    }

    if (authUser?.id) {
      const partition = getUserPartition(authUser.id, authUser.user_metadata, authUser.email);
      try {
        if (prisma && prisma.user) {
          const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
          if (dbUser) {
            if (dbUser.name && !/^aarav(\s+sharma)?$/i.test(dbUser.name)) partition.user.name = dbUser.name;
            if ((dbUser as any).preferredName && !/^aarav(\s+sharma)?$/i.test((dbUser as any).preferredName)) partition.user.preferredName = (dbUser as any).preferredName;
            if ((dbUser as any).userType) partition.user.userType = (dbUser as any).userType;
            if (dbUser.occupation) partition.user.occupation = dbUser.occupation;
            if (dbUser.semester && dbUser.semester !== "Semester 5") partition.user.semester = dbUser.semester;
            if (dbUser.branch && dbUser.branch !== "Computer Science & Engineering") partition.user.branch = dbUser.branch;
            if (dbUser.college && !/^iit delhi/i.test(dbUser.college)) partition.user.college = dbUser.college;
            partition.user.monthlyBudget = dbUser.monthlyBudget;
            partition.user.startingBalance = dbUser.startingBalance;
            partition.user.isOnboarded = dbUser.isOnboarded;
          }
        }
      } catch {
        // Fallback to partition
      }
      return partition.user;
    }

    return demoStore.user;
  },

  // Get Today's Pending Tasks
  getTodayEntries: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    if (userStores[userId]) {
      return userStores[userId].entries.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED");
    }

    return demoStore.entries.filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED");
  },

  // Get All Entries (Tasks + Transactions)
  getEntries: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    if (userStores[userId]) {
      return userStores[userId].entries;
    }

    return demoStore.entries;
  },

  // Get Transactions (Expenses and Income)
  getTransactions: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    const entries = userStores[userId]?.entries || demoStore.entries;
    return entries.filter((e) => e.type === "EXPENSE" || e.type === "INCOME");
  },

  // Get Habits
  getHabits: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    if (authUser?.id && prisma && prisma.habit) {
      try {
        const dbHabits = await prisma.habit.findMany({
          where: { userId },
          include: { logs: true },
          orderBy: { createdAt: "desc" },
        });
        if (dbHabits && dbHabits.length > 0) {
          const partition = getUserPartition(userId);
          partition.habits = dbHabits.map((h: any) => ({
            ...h,
            startDate: h.startDate ? h.startDate.toISOString() : null,
            createdAt: h.createdAt ? h.createdAt.toISOString() : null,
            updatedAt: h.updatedAt ? h.updatedAt.toISOString() : null,
            logs: (h.logs || []).map((l: any) => ({
              ...l,
              date: l.date ? l.date.toISOString() : null,
              createdAt: l.createdAt ? l.createdAt.toISOString() : null,
            })),
          }));
          return partition.habits;
        }
      } catch {
        // Fallback to partition
      }
    }

    return userStores[userId]?.habits || demoStore.habits;
  },

  // Get Goals
  getGoals: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    if (authUser?.id && prisma && prisma.goal) {
      try {
        const dbGoals = await prisma.goal.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (dbGoals && dbGoals.length > 0) {
          const partition = getUserPartition(userId);
          partition.goals = dbGoals.map((g: any) => {
            const meta = (g.metadata as any) || {};
            const milestones = Array.isArray(meta.milestones) ? meta.milestones : [];
            return {
              ...g,
              milestones,
              deadline: g.deadline ? g.deadline.toISOString() : null,
              createdAt: g.createdAt ? g.createdAt.toISOString() : null,
              updatedAt: g.updatedAt ? g.updatedAt.toISOString() : null,
            };
          });
          return partition.goals;
        }
      } catch {
        // Fallback to partition
      }
    }

    const rawGoals = userStores[userId]?.goals || demoStore.goals;
    return rawGoals.map((g: any) => ({
      ...g,
      milestones: Array.isArray(g.milestones)
        ? g.milestones
        : Array.isArray(g.metadata?.milestones)
        ? g.metadata.milestones
        : [],
    }));
  },

  // Get Courses
  getCourses: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    return userStores[userId]?.courses || demoStore.courses;
  },

  getRewind: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    const partition = userStores[userId] || demoStore;
    const displayName = getUserDisplayName(partition.user);
    const completedCount = partition.entries.filter((e) => e.status === "COMPLETED").length;
    const carriedCount = partition.entries.reduce((acc, e) => acc + (e.carriedCount || 0), 0);
    const totalSpent = partition.entries
      .filter((e) => e.type === "EXPENSE")
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const habitCount = partition.habits.length;

    return {
      id: `rewind-${userId}`,
      weekStartDate: new Date().toISOString(),
      completedTasks: completedCount,
      carriedTasks: carriedCount,
      totalSpent,
      habitsScore: habitCount > 0 ? 80 : 0,
      focusSuggestions: [
        "Maintain daily priority blocks",
        "Track expenses consistently",
        "Review habit streaks regularly",
      ],
      summaryText: completedCount > 0
        ? `You have completed ${completedCount} tasks this week with focused momentum.`
        : `Ready for a fresh start${displayName ? `, ${displayName}` : ""}? Begin by locking in your top focus today.`,
    };
  },

  getRecurringSpends: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    return userStores[userId]?.recurringSpends || demoStore.recurringSpends;
  },

  // Add a single entry (Task, Expense, Income) with user association & Supabase persistence
  addEntry: async (entry: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = entry.userId || authUser?.id || demoStore.user.id || "user-default";

    const priority = entry.priority || entry.metadata?.priority || "MEDIUM";
    const weight = entry.weight !== undefined && entry.weight !== null
      ? entry.weight
      : (priority === "URGENT" ? 0.95 : priority === "HIGH" ? 0.85 : priority === "MEDIUM" ? 0.6 : 0.4);
    const priorityScore = entry.priorityScore !== undefined && entry.priorityScore !== null
      ? entry.priorityScore
      : (priority === "URGENT" ? 95 : priority === "HIGH" ? 85 : priority === "MEDIUM" ? 65 : 45);

    const isRecurring = Boolean(entry.isRecurring ?? entry.metadata?.isRecurring);
    const recurringFrequency = entry.recurringFrequency || entry.metadata?.recurringFrequency || "NONE";

    const subtasks = Array.isArray(entry.subtasks)
      ? entry.subtasks.map((st: any) =>
          typeof st === "string"
            ? { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: st, completed: false }
            : st
        )
      : Array.isArray(entry.metadata?.subtasks)
      ? entry.metadata.subtasks
      : [];

    const status = entry.status || "PENDING";
    const completedAt = status === "COMPLETED" ? (entry.completedAt || new Date().toISOString()) : entry.completedAt;

    const newEntry = {
      id: entry.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      type: entry.type || "TASK",
      title: entry.title,
      description: entry.description || entry.metadata?.description || "",
      status,
      dueAt: entry.dueAt || null,
      effortMin: entry.effortMin || 30,
      priority,
      priorityScore,
      weight,
      carriedCount: entry.carriedCount || 0,
      snoozeCount: entry.snoozeCount || 0,
      rescheduledCount: entry.rescheduledCount || 0,
      amount: entry.amount || null,
      category: entry.category || "Personal",
      isRecurring,
      recurringFrequency,
      subtasks,
      goalId: entry.goalId || entry.metadata?.goalId || null,
      milestoneId: entry.milestoneId || entry.metadata?.milestoneId || null,
      habitId: entry.habitId || entry.metadata?.habitId || null,
      metadata: {
        ...(entry.metadata || {}),
        goalId: entry.goalId || entry.metadata?.goalId || null,
        milestoneId: entry.milestoneId || entry.metadata?.milestoneId || null,
        habitId: entry.habitId || entry.metadata?.habitId || null,
        description: entry.description || entry.metadata?.description || "",
        priority,
        isRecurring,
        recurringFrequency,
        subtasks,
        isFocus: Boolean(entry.metadata?.isFocus),
      },
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(completedAt ? { completedAt } : {}),
    };

    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      partition.entries.unshift(newEntry);
      await syncUserToSupabase(authUser.id, { entries: partition.entries });
    } else {
      demoStore.entries.unshift(newEntry);
    }

    try {
      if (prisma && prisma.entry) {
        await prisma.entry.create({
          data: {
            id: newEntry.id,
            userId: newEntry.userId,
            type: newEntry.type,
            title: newEntry.title,
            description: newEntry.description,
            status: newEntry.status,
            dueAt: newEntry.dueAt ? new Date(newEntry.dueAt) : null,
            effortMin: newEntry.effortMin,
            amount: newEntry.amount,
            category: newEntry.category,
            metadata: newEntry.metadata,
          },
        });
      }
    } catch {
      // In-memory / Supabase fallback
    }

    return newEntry;
  },

  // Save multiple entries
  saveEntries: async (entries: any[], explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";

    const createdEntries: any[] = [];
    for (const e of entries) {
      const priority = e.priority || e.metadata?.priority || "MEDIUM";
      const weight = e.weight !== undefined && e.weight !== null
        ? e.weight
        : (priority === "URGENT" ? 0.95 : priority === "HIGH" ? 0.85 : priority === "MEDIUM" ? 0.6 : 0.4);
      const priorityScore = e.priorityScore !== undefined && e.priorityScore !== null
        ? e.priorityScore
        : (priority === "URGENT" ? 95 : priority === "HIGH" ? 85 : priority === "MEDIUM" ? 65 : 45);

      const isRecurring = Boolean(e.isRecurring ?? e.metadata?.isRecurring);
      const recurringFrequency = e.recurringFrequency || e.metadata?.recurringFrequency || "NONE";

      const subtasks = Array.isArray(e.subtasks)
        ? e.subtasks.map((st: any) =>
            typeof st === "string"
              ? { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: st, completed: false }
              : st
          )
        : Array.isArray(e.metadata?.subtasks)
        ? e.metadata.subtasks
        : [];

      const status = e.status || "PENDING";
      const completedAt = status === "COMPLETED" ? (e.completedAt || new Date().toISOString()) : e.completedAt;

      const newEntry = {
        id: e.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: e.userId || userId,
        type: e.type || "TASK",
        title: e.title,
        description: e.description || e.metadata?.description || "",
        status,
        dueAt: e.dueAt || null,
        effortMin: e.effortMin || 30,
        priority,
        priorityScore,
        weight,
        carriedCount: e.carriedCount || 0,
        snoozeCount: e.snoozeCount || 0,
        rescheduledCount: e.rescheduledCount || 0,
        amount: e.amount || null,
        category: e.category || "Personal",
        isRecurring,
        recurringFrequency,
        subtasks,
        goalId: e.goalId || e.metadata?.goalId || null,
        milestoneId: e.milestoneId || e.metadata?.milestoneId || null,
        habitId: e.habitId || e.metadata?.habitId || null,
        metadata: {
          ...(e.metadata || {}),
          goalId: e.goalId || e.metadata?.goalId || null,
          milestoneId: e.milestoneId || e.metadata?.milestoneId || null,
          habitId: e.habitId || e.metadata?.habitId || null,
          description: e.description || e.metadata?.description || "",
          priority,
          isRecurring,
          recurringFrequency,
          subtasks,
          isFocus: Boolean(e.metadata?.isFocus),
        },
        createdAt: e.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(completedAt ? { completedAt } : {}),
      };
      createdEntries.push(newEntry);
    }

    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      createdEntries.forEach((ce) => partition.entries.unshift(ce));
      await syncUserToSupabase(authUser.id, { entries: partition.entries });
      return partition.entries;
    } else {
      createdEntries.forEach((ce) => demoStore.entries.unshift(ce));
      return demoStore.entries;
    }
  },

  // Patch an entry with actions (COMPLETE, UNCOMPLETE, SNOOZE, ROLLOVER, SET_FOCUS, etc.)
  patchEntry: async (id: string, action: string, payload?: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const entriesList = partition ? partition.entries : demoStore.entries;

    const entry = entriesList.find((e) => e.id === id);
    if (!entry) return null;

    if (!entry.metadata) entry.metadata = {};

    switch (action) {
      case "COMPLETE":
        entry.status = "COMPLETED";
        entry.completedAt = new Date().toISOString();
        break;

      case "UNCOMPLETE":
        entry.status = "PENDING";
        delete entry.completedAt;
        break;

      case "CONTINUE_WORKING":
        entry.status = "IN_PROGRESS";
        break;

      case "CANCEL":
        entry.status = "CANCELLED";
        break;

      case "SET_STATUS":
        if (payload?.status) {
          entry.status = payload.status;
          if (payload.status === "COMPLETED") {
            entry.completedAt = new Date().toISOString();
          } else {
            delete entry.completedAt;
          }
        }
        break;

      case "SNOOZE":
        entry.snoozeCount = (entry.snoozeCount || 0) + 1;
        const due = new Date(entry.dueAt || Date.now());
        const snoozeHours = payload?.hours || 4;
        entry.dueAt = new Date(due.getTime() + snoozeHours * 3600000).toISOString();
        break;

      case "ROLLOVER":
        entry.carriedCount = (entry.carriedCount || 0) + 1;
        entry.status = "ROLLED_OVER";
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(9, 0, 0, 0);
        entry.dueAt = nextDay.toISOString();
        break;

      case "DROP":
        entry.status = "DROPPED";
        break;

      case "DELETE":
        if (partition && authUser?.id) {
          partition.entries = partition.entries.filter((e) => e.id !== id);
          await syncUserToSupabase(authUser.id, { entries: partition.entries });
        } else {
          demoStore.entries = demoStore.entries.filter((e) => e.id !== id);
        }
        try {
          if (prisma && prisma.entry) {
            await prisma.entry.delete({ where: { id } }).catch(() => {});
          }
        } catch {}
        return { deleted: true, id };

      case "SET_FOCUS":
        entriesList.forEach((e) => {
          if (e.metadata) {
            e.metadata.isFocus = false;
          }
        });
        entry.metadata.isFocus = true;
        entry.weight = 0.95;
        entry.priorityScore = 95;
        break;

      case "UNSET_FOCUS":
        entry.metadata.isFocus = false;
        break;

      case "EDIT":
        if (payload?.title !== undefined) entry.title = payload.title;
        if (payload?.description !== undefined) {
          entry.description = payload.description;
          entry.metadata.description = payload.description;
        }
        if (payload?.category !== undefined) entry.category = payload.category;
        if (payload?.amount !== undefined) entry.amount = payload.amount !== null ? Number(payload.amount) : null;
        if (payload?.type !== undefined) entry.type = payload.type;
        if (payload?.status !== undefined) {
          entry.status = payload.status;
          if (payload.status === "COMPLETED") {
            entry.completedAt = new Date().toISOString();
          } else {
            delete entry.completedAt;
          }
        }
        if (payload?.dueAt !== undefined) entry.dueAt = payload.dueAt;
        if (payload?.effortMin !== undefined) entry.effortMin = payload.effortMin;
        if (payload?.metadata !== undefined) {
          entry.metadata = { ...(entry.metadata || {}), ...payload.metadata };
        }
        if (payload?.isRecurring !== undefined) {
          entry.isRecurring = payload.isRecurring;
          entry.metadata.isRecurring = payload.isRecurring;
        }
        if (payload?.recurringFrequency !== undefined) {
          entry.recurringFrequency = payload.recurringFrequency;
          entry.metadata.recurringFrequency = payload.recurringFrequency;
        }
        if (Array.isArray(payload?.subtasks)) {
          entry.subtasks = payload.subtasks.map((st: any) =>
            typeof st === "string"
              ? { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: st, completed: false }
              : st
          );
          entry.metadata.subtasks = entry.subtasks;
        }
        if (payload?.priority) {
          entry.priority = payload.priority;
          entry.metadata.priority = payload.priority;
          const p = payload.priority;
          entry.weight = p === "URGENT" ? 0.95 : p === "HIGH" ? 0.85 : p === "MEDIUM" ? 0.6 : 0.4;
          entry.priorityScore = p === "URGENT" ? 95 : p === "HIGH" ? 85 : p === "MEDIUM" ? 65 : 45;
        }
        break;

      case "RESCHEDULE":
        if (payload?.dueAt) {
          entry.dueAt = payload.dueAt;
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          entry.dueAt = tomorrow.toISOString();
        }
        entry.rescheduledCount = (entry.rescheduledCount || 0) + 1;
        if (entry.status === "ROLLED_OVER" || entry.status === "CANCELLED") {
          entry.status = "PENDING";
        }
        break;

      case "ADD_SUBTASK":
        if (!Array.isArray(entry.metadata.subtasks)) {
          entry.metadata.subtasks = [];
        }
        const newSt = {
          id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: payload?.title || "New step",
          completed: false,
        };
        entry.metadata.subtasks.push(newSt);
        entry.subtasks = entry.metadata.subtasks;
        break;

      case "TOGGLE_SUBTASK":
        if (Array.isArray(entry.metadata.subtasks)) {
          const targetSubtask = entry.metadata.subtasks.find((s: any) => s.id === payload?.subtaskId);
          if (targetSubtask) {
            targetSubtask.completed = !targetSubtask.completed;
          }
          entry.subtasks = entry.metadata.subtasks;
        }
        break;

      case "DELETE_SUBTASK":
        if (Array.isArray(entry.metadata.subtasks)) {
          entry.metadata.subtasks = entry.metadata.subtasks.filter((s: any) => s.id !== payload?.subtaskId);
          entry.subtasks = entry.metadata.subtasks;
        }
        break;

      case "BREAKDOWN":
        if (Array.isArray(payload?.subtasks)) {
          entry.metadata.subtasks = payload.subtasks.map((stepTitle: string) => ({
            id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: stepTitle,
            completed: false,
          }));
          entry.subtasks = entry.metadata.subtasks;
        }
        break;

      case "UPDATE_EFFORT":
        if (payload?.effortMin) {
          entry.effortMin = payload.effortMin;
        }
        break;
    }

    entry.updatedAt = new Date().toISOString();

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { entries: partition.entries });
    }

    try {
      if (prisma && prisma.entry) {
        if (action === "DELETE") {
          await prisma.entry.delete({ where: { id } });
        } else {
          await prisma.entry.update({
            where: { id },
            data: {
              title: entry.title,
              description: entry.description,
              status: entry.status,
              dueAt: entry.dueAt ? new Date(entry.dueAt) : null,
              effortMin: entry.effortMin,
              category: entry.category,
              amount: entry.amount !== undefined ? (entry.amount !== null ? Number(entry.amount) : null) : undefined,
              type: entry.type,
              metadata: entry.metadata,
            },
          });
        }
      }
    } catch {
      // In-memory fallback
    }

    // Immediate goal progress synchronization if task is linked to a goal
    const linkedGoalId = entry.goalId || entry.metadata?.goalId;
    if (linkedGoalId) {
      const goalsList = partition ? partition.goals : demoStore.goals;
      const linkedGoal = goalsList.find((g: any) => g.id === linkedGoalId);
      if (linkedGoal) {
        // If task is also linked to a milestone
        const linkedMilestoneId = entry.milestoneId || entry.metadata?.milestoneId;
        if (linkedMilestoneId && Array.isArray(linkedGoal.milestones)) {
          const ms = linkedGoal.milestones.find((m: any) => m.id === linkedMilestoneId);
          if (ms) {
            ms.completed = entry.status === "COMPLETED";
            ms.completedAt = ms.completed ? new Date().toISOString() : null;
          }
        }

        if (linkedGoal.trackingType === "TASK") {
          const matchingTasks = entriesList.filter(
            (e: any) => (e.goalId === linkedGoalId || e.metadata?.goalId === linkedGoalId) && e.status !== "CANCELLED"
          );
          linkedGoal.targetValue = matchingTasks.length;
          linkedGoal.currentValue = matchingTasks.filter((e: any) => e.status === "COMPLETED").length;
          if (linkedGoal.targetValue > 0 && linkedGoal.currentValue >= linkedGoal.targetValue) {
            linkedGoal.status = "COMPLETED";
          } else if (linkedGoal.status === "COMPLETED" && linkedGoal.currentValue < linkedGoal.targetValue) {
            linkedGoal.status = "IN_PROGRESS";
          }
        } else if (linkedGoal.trackingType === "MILESTONE" && Array.isArray(linkedGoal.milestones) && linkedGoal.milestones.length > 0) {
          linkedGoal.targetValue = linkedGoal.milestones.length;
          linkedGoal.currentValue = linkedGoal.milestones.filter((m: any) => m.completed).length;
          if (linkedGoal.targetValue > 0 && linkedGoal.currentValue >= linkedGoal.targetValue) {
            linkedGoal.status = "COMPLETED";
          } else if (linkedGoal.status === "COMPLETED" && linkedGoal.currentValue < linkedGoal.targetValue) {
            linkedGoal.status = "IN_PROGRESS";
          }
        }
        linkedGoal.updatedAt = new Date().toISOString();
        if (authUser?.id && partition) {
          await syncUserToSupabase(authUser.id, { goals: partition.goals });
        }
        try {
          if (prisma && prisma.goal) {
            await prisma.goal.update({
              where: { id: linkedGoal.id },
              data: {
                currentValue: linkedGoal.currentValue,
                targetValue: linkedGoal.targetValue,
                status: linkedGoal.status,
                metadata: linkedGoal.metadata,
              },
            }).catch(() => {});
          }
        } catch {}
      }
    }

    return entry;
  },

  // Set user profile
  setUserData: async (userData: Record<string, any>, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      Object.assign(partition.user, userData);
      await syncUserToSupabase(authUser.id, userData);
      return partition.user;
    }

    Object.assign(demoStore.user, userData);
    return demoStore.user;
  },

  // Set user tasks
  setTasks: async (tasks: any[], explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      partition.entries = tasks;
      await syncUserToSupabase(authUser.id, { entries: tasks });
      return partition.entries;
    }

    demoStore.entries = tasks;
    return demoStore.entries;
  },

  // Set user habits
  setHabits: async (habits: any[], explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      partition.habits = habits;
      await syncUserToSupabase(authUser.id, { habits });
      return partition.habits;
    }

    demoStore.habits = habits;
    return demoStore.habits;
  },

  // Set user goals
  setGoals: async (goals: any[], explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    if (authUser?.id) {
      const partition = getUserPartition(authUser.id);
      partition.goals = goals;
      await syncUserToSupabase(authUser.id, { goals });
      return partition.goals;
    }

    demoStore.goals = goals;
    return demoStore.goals;
  },

  setRecurringSpends: (spends: any[], explicitUserId?: string) => {
    if (explicitUserId && userStores[explicitUserId]) {
      userStores[explicitUserId].recurringSpends = spends;
      return userStores[explicitUserId].recurringSpends;
    }
    demoStore.recurringSpends = spends;
    return demoStore.recurringSpends;
  },

  addRecurringSpend: async (spend: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const spendsList = partition ? partition.recurringSpends : demoStore.recurringSpends;

    const newSpend = {
      id: spend.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: spend.name,
      amount: Number(spend.amount) || 0,
      dayOfMonth: Number(spend.dayOfMonth) || 1,
      category: spend.category || "General",
      frequency: spend.frequency || "MONTHLY",
      status: spend.status || "ACTIVE",
      nextDueDate: spend.nextDueDate || null,
      notes: spend.notes || "",
      isPaid: Boolean(spend.isPaid),
      createdAt: spend.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    spendsList.unshift(newSpend);

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { recurringSpends: partition.recurringSpends });
    }

    try {
      if (prisma && prisma.recurringSpend) {
        await prisma.recurringSpend.create({
          data: {
            id: newSpend.id,
            userId,
            name: newSpend.name,
            amount: newSpend.amount,
            dayOfMonth: newSpend.dayOfMonth,
            category: newSpend.category,
            frequency: newSpend.frequency,
            status: newSpend.status,
            nextDueDate: newSpend.nextDueDate ? new Date(newSpend.nextDueDate) : null,
            notes: newSpend.notes,
            isPaid: newSpend.isPaid,
          },
        }).catch(() => {});
      }
    } catch {}

    return newSpend;
  },

  updateRecurringSpend: async (id: string, updates: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const spendsList = partition ? partition.recurringSpends : demoStore.recurringSpends;

    const spend = spendsList.find((s) => s.id === id);
    if (!spend) return null;

    Object.assign(spend, updates, { updatedAt: new Date().toISOString() });

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { recurringSpends: partition.recurringSpends });
    }

    try {
      if (prisma && prisma.recurringSpend) {
        await prisma.recurringSpend.update({
          where: { id },
          data: {
            name: spend.name,
            amount: Number(spend.amount),
            dayOfMonth: Number(spend.dayOfMonth),
            category: spend.category,
            frequency: spend.frequency,
            status: spend.status,
            nextDueDate: spend.nextDueDate ? new Date(spend.nextDueDate) : null,
            notes: spend.notes,
            isPaid: Boolean(spend.isPaid),
          },
        }).catch(() => {});
      }
    } catch {}

    return spend;
  },

  deleteRecurringSpend: async (id: string, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;

    if (partition && authUser?.id) {
      partition.recurringSpends = partition.recurringSpends.filter((s) => s.id !== id);
      await syncUserToSupabase(authUser.id, { recurringSpends: partition.recurringSpends });
    } else {
      demoStore.recurringSpends = demoStore.recurringSpends.filter((s) => s.id !== id);
    }

    try {
      if (prisma && prisma.recurringSpend) {
        await prisma.recurringSpend.delete({ where: { id } }).catch(() => {});
      }
    } catch {}

    return { deleted: true, id };
  },

  getBikeLogs: async (explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    return userStores[userId]?.bikeLogs || demoStore.bikeLogs || [];
  },

  addBikeLog: async (log: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const logsList = partition ? partition.bikeLogs : demoStore.bikeLogs;

    const newLog = {
      id: log.id || `bike-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      bikeName: log.bikeName || "My Bike",
      type: log.type || "FUEL",
      litres: log.litres ? Number(log.litres) : null,
      fuelPricePerLitre: log.fuelPricePerLitre ? Number(log.fuelPricePerLitre) : null,
      amount: Number(log.amount) || 0,
      odometer: log.odometer ? Number(log.odometer) : null,
      distance: log.distance ? Number(log.distance) : null,
      serviceType: log.serviceType || null,
      date: log.date || new Date().toISOString(),
      notes: log.notes || "",
      createdAt: new Date().toISOString(),
    };

    logsList.unshift(newLog);

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { bikeLogs: partition.bikeLogs });
    }

    try {
      if (prisma && prisma.bikeLog) {
        await prisma.bikeLog.create({
          data: {
            id: newLog.id,
            userId,
            bikeName: newLog.bikeName,
            type: newLog.type,
            litres: newLog.litres,
            fuelPricePerLitre: newLog.fuelPricePerLitre,
            amount: newLog.amount,
            odometer: newLog.odometer,
            distance: newLog.distance,
            serviceType: newLog.serviceType,
            date: new Date(newLog.date),
            notes: newLog.notes,
          },
        }).catch(() => {});
      }
    } catch {}

    return newLog;
  },

  deleteBikeLog: async (id: string, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;

    if (partition && authUser?.id) {
      partition.bikeLogs = (partition.bikeLogs || []).filter((b) => b.id !== id);
      await syncUserToSupabase(authUser.id, { bikeLogs: partition.bikeLogs });
    } else {
      demoStore.bikeLogs = (demoStore.bikeLogs || []).filter((b) => b.id !== id);
    }

    try {
      if (prisma && prisma.bikeLog) {
        await prisma.bikeLog.delete({ where: { id } }).catch(() => {});
      }
    } catch {}

    return { deleted: true, id };
  },

  addGoal: async (goal: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const goalsList = partition ? partition.goals : demoStore.goals;

    const milestones = Array.isArray(goal.milestones)
      ? goal.milestones.map((m: any, idx: number) => ({
          id: m.id || `m-${Date.now()}-${idx}`,
          title: m.title || "Milestone",
          completed: Boolean(m.completed),
          completedAt: m.completed ? (m.completedAt || new Date().toISOString()) : null,
          order: m.order ?? idx,
          linkedTaskId: m.linkedTaskId || null,
        }))
      : [];

    const newGoal = {
      id: goal.id || `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      title: goal.title,
      description: goal.description || "",
      targetValue: Number(goal.targetValue || (milestones.length > 0 ? milestones.length : 100)),
      currentValue: Number(goal.currentValue || (milestones.length > 0 ? milestones.filter((m: any) => m.completed).length : 0)),
      unit: goal.unit || (milestones.length > 0 ? "steps" : "%"),
      category: goal.category || "Personal",
      priority: goal.priority || "MEDIUM",
      status: goal.status || "IN_PROGRESS",
      trackingType: goal.trackingType || (milestones.length > 0 ? "MILESTONE" : "NUMERIC"),
      notes: goal.notes || "",
      milestones,
      metadata: {
        ...(goal.metadata || {}),
        milestones,
      },
      deadline: goal.deadline || goal.targetDate || null,
      color: goal.color || "#38BDF8",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    goalsList.unshift(newGoal);

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { goals: partition.goals });
    }

    try {
      if (prisma && prisma.goal) {
        await prisma.goal.create({
          data: {
            id: newGoal.id,
            userId,
            title: newGoal.title,
            description: newGoal.description,
            targetValue: newGoal.targetValue,
            currentValue: newGoal.currentValue,
            unit: newGoal.unit,
            category: newGoal.category,
            priority: newGoal.priority,
            status: newGoal.status,
            trackingType: newGoal.trackingType,
            notes: newGoal.notes,
            metadata: newGoal.metadata,
            deadline: newGoal.deadline ? new Date(newGoal.deadline) : null,
            color: newGoal.color,
          },
        }).catch(() => {});
      }
    } catch {}

    return newGoal;
  },

  updateGoal: async (id: string, updates: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const goalsList = partition ? partition.goals : demoStore.goals;

    const goal = goalsList.find((g: any) => g.id === id);
    if (!goal) return null;

    if (updates.milestones && Array.isArray(updates.milestones)) {
      goal.milestones = updates.milestones;
      if (!goal.metadata) goal.metadata = {};
      goal.metadata.milestones = updates.milestones;
    }

    Object.assign(goal, updates, { updatedAt: new Date().toISOString() });

    // Recalculate if milestones are present and trackingType is MILESTONE
    if (goal.trackingType === "MILESTONE" && Array.isArray(goal.milestones) && goal.milestones.length > 0) {
      goal.targetValue = goal.milestones.length;
      goal.currentValue = goal.milestones.filter((m: any) => m.completed).length;
      if (goal.currentValue === goal.targetValue && goal.status !== "COMPLETED") {
        goal.status = "COMPLETED";
      }
    }

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { goals: partition.goals });
    }

    try {
      if (prisma && prisma.goal) {
        await prisma.goal.update({
          where: { id },
          data: {
            title: goal.title,
            description: goal.description,
            targetValue: goal.targetValue !== undefined ? Number(goal.targetValue) : undefined,
            currentValue: goal.currentValue !== undefined ? Number(goal.currentValue) : undefined,
            unit: goal.unit,
            category: goal.category,
            priority: goal.priority,
            status: goal.status,
            trackingType: goal.trackingType,
            notes: goal.notes,
            metadata: goal.metadata,
            deadline: goal.deadline ? new Date(goal.deadline) : null,
            color: goal.color,
          },
        }).catch(() => {});
      }
    } catch {}

    return goal;
  },

  patchGoalMilestone: async (
    goalId: string,
    action: "TOGGLE" | "ADD" | "DELETE",
    payload?: any,
    explicitUserId?: string
  ) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const goalsList = partition ? partition.goals : demoStore.goals;

    const goal = goalsList.find((g: any) => g.id === goalId);
    if (!goal) return null;

    if (!Array.isArray(goal.milestones)) {
      goal.milestones = Array.isArray(goal.metadata?.milestones) ? [...goal.metadata.milestones] : [];
    }

    switch (action) {
      case "TOGGLE": {
        const milestone = goal.milestones.find((m: any) => m.id === payload?.milestoneId);
        if (milestone) {
          milestone.completed = payload?.completed !== undefined ? payload.completed : !milestone.completed;
          milestone.completedAt = milestone.completed ? new Date().toISOString() : null;
        }
        break;
      }
      case "ADD": {
        const newM = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: payload?.title || "New Milestone",
          completed: false,
          completedAt: null,
          order: goal.milestones.length,
          linkedTaskId: payload?.linkedTaskId || null,
        };
        goal.milestones.push(newM);
        break;
      }
      case "DELETE": {
        goal.milestones = goal.milestones.filter((m: any) => m.id !== payload?.milestoneId);
        break;
      }
    }

    if (!goal.metadata) goal.metadata = {};
    goal.metadata.milestones = goal.milestones;

    if (goal.trackingType === "MILESTONE") {
      goal.targetValue = goal.milestones.length;
      goal.currentValue = goal.milestones.filter((m: any) => m.completed).length;
      if (goal.targetValue > 0 && goal.currentValue >= goal.targetValue) {
        goal.status = "COMPLETED";
      } else if (goal.status === "COMPLETED" && goal.currentValue < goal.targetValue) {
        goal.status = "IN_PROGRESS";
      }
    }

    goal.updatedAt = new Date().toISOString();

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { goals: partition.goals });
    }

    try {
      if (prisma && prisma.goal) {
        await prisma.goal.update({
          where: { id: goalId },
          data: {
            currentValue: goal.currentValue,
            targetValue: goal.targetValue,
            status: goal.status,
            metadata: goal.metadata,
          },
        }).catch(() => {});
      }
    } catch {}

    return goal;
  },

  deleteGoal: async (id: string, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;

    if (partition && authUser?.id) {
      partition.goals = (partition.goals || []).filter((g: any) => g.id !== id);
      await syncUserToSupabase(authUser.id, { goals: partition.goals });
    } else {
      demoStore.goals = (demoStore.goals || []).filter((g: any) => g.id !== id);
    }

    try {
      if (prisma && prisma.goal) {
        await prisma.goal.delete({ where: { id } }).catch(() => {});
      }
    } catch {}

    return { deleted: true, id };
  },

  addHabit: async (habit: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const userId = authUser?.id || demoStore.user.id || "user-default";
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const habitsList = partition ? partition.habits : demoStore.habits;

    const newHabit = {
      id: habit.id || `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      name: habit.name,
      description: habit.description || "",
      category: habit.category || "General",
      frequencyType: habit.frequencyType || "DAILY",
      frequencyDays: Number(habit.frequencyDays || 7),
      targetDaysOfWeek: Array.isArray(habit.targetDaysOfWeek) ? habit.targetDaysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      dailyTarget: Number(habit.dailyTarget || 1),
      reminderTime: habit.reminderTime || null,
      status: habit.status || "ACTIVE",
      startDate: habit.startDate || new Date().toISOString(),
      streakCount: 0,
      bestStreak: 0,
      graceDaysLeft: Number(habit.graceDaysLeft ?? 2),
      monthlyGraceMax: Number(habit.monthlyGraceMax ?? 2),
      color: habit.color || "#E0A458",
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    habitsList.unshift(newHabit);

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { habits: partition.habits });
    }

    try {
      if (prisma && prisma.habit) {
        await prisma.habit.create({
          data: {
            id: newHabit.id,
            userId,
            name: newHabit.name,
            description: newHabit.description,
            category: newHabit.category,
            frequencyType: newHabit.frequencyType,
            frequencyDays: newHabit.frequencyDays,
            targetDaysOfWeek: newHabit.targetDaysOfWeek,
            dailyTarget: newHabit.dailyTarget,
            reminderTime: newHabit.reminderTime,
            status: newHabit.status,
            startDate: new Date(newHabit.startDate),
            streakCount: 0,
            bestStreak: 0,
            graceDaysLeft: newHabit.graceDaysLeft,
            monthlyGraceMax: newHabit.monthlyGraceMax,
            color: newHabit.color,
          },
        }).catch(() => {});
      }
    } catch {}

    return newHabit;
  },

  updateHabit: async (id: string, updates: any, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const habitsList = partition ? partition.habits : demoStore.habits;

    const habit = habitsList.find((h: any) => h.id === id);
    if (!habit) return null;

    Object.assign(habit, updates, { updatedAt: new Date().toISOString() });

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { habits: partition.habits });
    }

    try {
      if (prisma && prisma.habit) {
        await prisma.habit.update({
          where: { id },
          data: {
            name: habit.name,
            description: habit.description,
            category: habit.category,
            frequencyType: habit.frequencyType,
            frequencyDays: habit.frequencyDays,
            targetDaysOfWeek: habit.targetDaysOfWeek,
            dailyTarget: habit.dailyTarget,
            reminderTime: habit.reminderTime,
            status: habit.status,
            graceDaysLeft: habit.graceDaysLeft,
            monthlyGraceMax: habit.monthlyGraceMax,
            color: habit.color,
          },
        }).catch(() => {});
      }
    } catch {}

    return habit;
  },

  deleteHabit: async (id: string, explicitUserId?: string) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;

    if (partition && authUser?.id) {
      partition.habits = (partition.habits || []).filter((h: any) => h.id !== id);
      await syncUserToSupabase(authUser.id, { habits: partition.habits });
    } else {
      demoStore.habits = (demoStore.habits || []).filter((h: any) => h.id !== id);
    }

    try {
      if (prisma && prisma.habit) {
        await prisma.habit.delete({ where: { id } }).catch(() => {});
      }
    } catch {}

    return { deleted: true, id };
  },

  toggleHabitLog: async (
    habitId: string,
    dateStr: string, // YYYY-MM-DD
    completed: boolean,
    note?: string,
    explicitUserId?: string
  ) => {
    const authUser = explicitUserId ? { id: explicitUserId } : await getAuthenticatedUser();
    const partition = authUser?.id ? getUserPartition(authUser.id) : null;
    const habitsList = partition ? partition.habits : demoStore.habits;

    const habit = habitsList.find((h: any) => h.id === habitId);
    if (!habit) return null;

    if (!Array.isArray(habit.logs)) {
      habit.logs = [];
    }

    const existingLogIndex = habit.logs.findIndex((l: any) => {
      const d = typeof l.date === "string" ? l.date.split("T")[0] : new Date(l.date).toISOString().split("T")[0];
      return d === dateStr;
    });

    const now = new Date();
    let usedGrace = false;

    if (existingLogIndex >= 0) {
      if (habit.logs[existingLogIndex].completed === completed && !note) {
        // Toggle off / Undo
        habit.logs.splice(existingLogIndex, 1);
        try {
          if (prisma && prisma.habitLog) {
            await prisma.habitLog.deleteMany({
              where: {
                habitId,
                date: {
                  gte: new Date(dateStr + "T00:00:00Z"),
                  lte: new Date(dateStr + "T23:59:59Z"),
                },
              },
            }).catch(() => {});
          }
        } catch {}
      } else {
        // Update existing log
        habit.logs[existingLogIndex].completed = completed;
        if (note !== undefined) habit.logs[existingLogIndex].note = note;
      }
    } else {
      // Check grace day application if completed === false
      if (!completed && habit.graceDaysLeft > 0) {
        usedGrace = true;
        habit.graceDaysLeft = Math.max(0, habit.graceDaysLeft - 1);
      }

      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        habitId,
        date: dateStr + "T12:00:00.000Z",
        completed,
        usedGrace,
        note: note || null,
        createdAt: now.toISOString(),
      };
      habit.logs.push(newLog);

      try {
        if (prisma && prisma.habitLog) {
          await prisma.habitLog.create({
            data: {
              id: newLog.id,
              habitId,
              date: new Date(newLog.date),
              completed: newLog.completed,
              usedGrace: newLog.usedGrace,
              note: newLog.note,
            },
          }).catch(() => {});
        }
      } catch {}
    }

    // Recalculate streak strictly from actual saved logs
    const { currentStreak, bestStreak } = calculateHabitStreak(habit, now);
    habit.streakCount = currentStreak;
    habit.bestStreak = bestStreak;
    habit.updatedAt = now.toISOString();

    if (authUser?.id && partition) {
      await syncUserToSupabase(authUser.id, { habits: partition.habits });
    }

    try {
      if (prisma && prisma.habit) {
        await prisma.habit.update({
          where: { id: habitId },
          data: {
            streakCount: habit.streakCount,
            bestStreak: habit.bestStreak,
            graceDaysLeft: habit.graceDaysLeft,
          },
        }).catch(() => {});
      }
    } catch {}

    return habit;
  },
};
