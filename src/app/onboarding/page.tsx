"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  IndianRupee,
  Flame,
  Sun,
  Moon,
  Plus,
  Trash2,
  Briefcase,
  Target,
  Dumbbell,
  Shield,
  AlertCircle,
  BookOpen,
  User,
  HeartPulse,
  Check,
  GraduationCap,
  Sparkle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface TaskItem {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "NORMAL";
  dueAt?: string;
  isRecurring: boolean;
  recurringFrequency: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  isPendingWork: boolean;
}

interface GoalItem {
  id: string;
  title: string;
  type: "SHORT_TERM" | "LONG_TERM";
  category: string;
  targetValue?: number;
  unit?: string;
  deadline?: string;
}

interface HabitItem {
  id: string;
  name: string;
  frequencyDays: number;
  icon: string;
  color: string;
}

interface FinancialGoalItem {
  id: string;
  title: string;
  targetAmount: number;
}

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  "About You",
  "Focus Areas",
  "Goals & Rhythm",
  "Daily Schedule",
  "Financial Setup",
  "Tasks & Priorities",
  "Habits & Fitness",
  "Launch Desk",
];

export default function OnboardingPage() {
  const router = useRouter();

  // Navigation state: 1 to 8
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ================= STEP 1: ABOUT YOU & PROFILE =================
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [userType, setUserType] = useState<string>("Working Professional");
  const [occupation, setOccupation] = useState("");

  // Conditional Education fields (when userType === "Student" or college area selected)
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");

  // ================= STEP 2: FOCUS AREAS =================
  const [focusAreas, setFocusAreas] = useState<string[]>([
    "tasks",
    "routines",
    "goals",
  ]);
  const [primaryFocus, setPrimaryFocus] = useState<string>("Tasks");

  // ================= STEP 3: GOALS & RHYTHM =================
  const [mainGoals, setMainGoals] = useState<string[]>([
    "Build consistent daily habits & routines",
    "Crush daily tasks with zero stress",
  ]);
  const [workPace, setWorkPace] = useState<string>("Structured & Focused");
  const [reflectionPref, setReflectionPref] = useState<string>(
    "Evening Wind-down (9 PM)"
  );

  // ================= STEP 4: DAILY LIFE & SCHEDULE =================
  const [wakeUpTime, setWakeUpTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [availableHours, setAvailableHours] = useState(8);
  const [quietHoursStart, setQuietHoursStart] = useState("22:30");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  const [reminderPref, setReminderPref] = useState("Balanced");
  const [routineBlocks, setRoutineBlocks] = useState<string[]>([
    "🌅 Morning Kickoff",
    "💻 Deep Work Block",
    "🥪 Midday Recharge",
    "⚡ Action Execution",
    "🏃 Workout & Movement",
    "🌙 Evening Wind-down",
  ]);
  const [customRoutineBlock, setCustomRoutineBlock] = useState("");

  // ================= STEP 5: FINANCIAL SETUP (OPTIONAL) =================
  const [balance, setBalance] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [financialGoals, setFinancialGoals] = useState<FinancialGoalItem[]>([]);
  const [newFGoalTitle, setNewFGoalTitle] = useState("");
  const [newFGoalAmount, setNewFGoalAmount] = useState("");
  const [bikeTravelExpenses, setBikeTravelExpenses] = useState("");

  // ================= STEP 6: TASKS & PRIORITIES (OPTIONAL) =================
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<
    "HIGH" | "MEDIUM" | "NORMAL"
  >("HIGH");
  const [taskDeadline, setTaskDeadline] = useState("today");
  const [taskCustomDate, setTaskCustomDate] = useState("");
  const [taskRecurring, setTaskRecurring] = useState<
    "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"
  >("NONE");
  const [taskIsPending, setTaskIsPending] = useState(false);

  // Short & long term goals
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState<"SHORT_TERM" | "LONG_TERM">(
    "SHORT_TERM"
  );
  const [goalCategory, setGoalCategory] = useState("Career");

  // ================= STEP 7: HABITS & FITNESS (OPTIONAL) =================
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [habitName, setHabitName] = useState("");
  const [habitFrequency, setHabitFrequency] = useState(5);
  const [habitIcon, setHabitIcon] = useState("⚡");
  const [workoutTargetDays, setWorkoutTargetDays] = useState(4);
  const [workoutFocus, setWorkoutFocus] = useState("Strength / Gym");
  const [targetSleepHours, setTargetSleepHours] = useState(7.5);
  const [waterIntakeLiters, setWaterIntakeLiters] = useState(3.0);
  const [routineCadence, setRoutineCadence] = useState("Consistent daily rhythm");

  // ================= STEP 8: PERSONALIZE YOUR DASHBOARD =================
  const [firstView, setFirstView] = useState("today");

  // Toggle helper for focus areas
  const toggleFocusArea = (id: string) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Toggle helper for main goals
  const toggleMainGoal = (goal: string) => {
    setMainGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Toggle routine block
  const toggleRoutineBlock = (block: string) => {
    setRoutineBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );
  };

  const addCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoutineBlock.trim()) return;
    if (!routineBlocks.includes(customRoutineBlock.trim())) {
      setRoutineBlocks([...routineBlocks, customRoutineBlock.trim()]);
    }
    setCustomRoutineBlock("");
  };

  // Add Financial Goal
  const addFinancialGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFGoalTitle.trim() || !newFGoalAmount) return;
    setFinancialGoals([
      ...financialGoals,
      {
        id: `fg-${Date.now()}`,
        title: newFGoalTitle.trim(),
        targetAmount: parseFloat(newFGoalAmount),
      },
    ]);
    setNewFGoalTitle("");
    setNewFGoalAmount("");
  };

  // Add Task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let dueIso: string | undefined;
    const now = new Date();
    if (taskDeadline === "today") {
      now.setHours(20, 0, 0, 0);
      dueIso = now.toISOString();
    } else if (taskDeadline === "tomorrow") {
      const tmrw = new Date(now);
      tmrw.setDate(tmrw.getDate() + 1);
      tmrw.setHours(18, 0, 0, 0);
      dueIso = tmrw.toISOString();
    } else if (taskDeadline === "custom" && taskCustomDate) {
      dueIso = new Date(taskCustomDate).toISOString();
    }

    setTasks([
      ...tasks,
      {
        id: `task-${Date.now()}`,
        title: taskTitle.trim(),
        priority: taskPriority,
        dueAt: dueIso,
        isRecurring: taskRecurring !== "NONE",
        recurringFrequency: taskRecurring,
        isPendingWork: taskIsPending,
      },
    ]);
    setTaskTitle("");
    setTaskIsPending(false);
  };

  // Add Goal
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setGoals([
      ...goals,
      {
        id: `goal-${Date.now()}`,
        title: goalTitle.trim(),
        type: goalType,
        category: goalCategory,
      },
    ]);
    setGoalTitle("");
  };

  // Add Habit
  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    setHabits([
      ...habits,
      {
        id: `habit-${Date.now()}`,
        name: habitName.trim(),
        frequencyDays: habitFrequency,
        icon: habitIcon,
        color: "#E0A458",
      },
    ]);
    setHabitName("");
  };

  // Restore existing draft on mount if available
  useEffect(() => {
    let isMounted = true;
    async function loadOnboardingDraft() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted) return;

        // If user is already onboarded, immediately route to dashboard
        if (data.isOnboarded) {
          router.push("/");
          return;
        }

        if (data.draft) {
          const d = data.draft;
          if (typeof d.step === "number" && d.step >= 1 && d.step <= TOTAL_STEPS) {
            setStep(d.step);
          }
          if (d.name) setName(d.name);
          else if (data.name) setName(data.name);

          if (d.preferredName) setPreferredName(d.preferredName);
          else if (data.preferredName) setPreferredName(data.preferredName);

          if (d.userType) setUserType(d.userType);
          if (Array.isArray(d.mainGoals) && d.mainGoals.length > 0)
            setMainGoals(d.mainGoals);
          if (d.primaryFocus) setPrimaryFocus(d.primaryFocus);

          if (d.college) setCollege(d.college);
          if (d.semester) setSemester(d.semester);
          if (d.branch) setBranch(d.branch);
          if (d.educationDetails?.institution)
            setCollege(d.educationDetails.institution);
          if (d.educationDetails?.degreeBranch)
            setBranch(d.educationDetails.degreeBranch);
          if (d.educationDetails?.yearSemester)
            setSemester(d.educationDetails.yearSemester);

          if (d.occupation) setOccupation(d.occupation);
          if (Array.isArray(d.focusAreas) && d.focusAreas.length > 0)
            setFocusAreas(d.focusAreas);
          if (d.personalPreferences?.pace)
            setWorkPace(d.personalPreferences.pace);
          if (d.personalPreferences?.reflection)
            setReflectionPref(d.personalPreferences.reflection);
          if (d.wakeUpTime) setWakeUpTime(d.wakeUpTime);
          if (d.sleepTime) setSleepTime(d.sleepTime);
          if (d.workingHoursStart) setWorkingHoursStart(d.workingHoursStart);
          if (d.workingHoursEnd) setWorkingHoursEnd(d.workingHoursEnd);
          if (typeof d.availableHoursPerDay === "number")
            setAvailableHours(d.availableHoursPerDay);
          if (d.quietHoursStart) setQuietHoursStart(d.quietHoursStart);
          if (d.quietHoursEnd) setQuietHoursEnd(d.quietHoursEnd);
          if (d.reminderPreference) setReminderPref(d.reminderPreference);
          if (Array.isArray(d.dailyRoutine) && d.dailyRoutine.length > 0)
            setRoutineBlocks(d.dailyRoutine);
          if (d.startingBalance != null) setBalance(String(d.startingBalance));
          if (d.monthlyIncome != null)
            setMonthlyIncome(String(d.monthlyIncome));
          if (d.currentSavings != null)
            setCurrentSavings(String(d.currentSavings));
          if (d.monthlyBudget != null)
            setMonthlyBudget(String(d.monthlyBudget));
          if (Array.isArray(d.financialGoals))
            setFinancialGoals(d.financialGoals);
          if (d.bikeTravelExpenses != null)
            setBikeTravelExpenses(String(d.bikeTravelExpenses));
          if (Array.isArray(d.tasks)) setTasks(d.tasks);
          if (Array.isArray(d.goals)) setGoals(d.goals);
          if (Array.isArray(d.habits)) setHabits(d.habits);
          if (typeof d.workoutTargetDays === "number")
            setWorkoutTargetDays(d.workoutTargetDays);
          if (d.fitnessPreferences?.workoutFocus)
            setWorkoutFocus(d.fitnessPreferences.workoutFocus);
          if (typeof d.fitnessPreferences?.targetSleepHours === "number")
            setTargetSleepHours(d.fitnessPreferences.targetSleepHours);
          if (typeof d.fitnessPreferences?.waterIntakeLiters === "number")
            setWaterIntakeLiters(d.fitnessPreferences.waterIntakeLiters);
          if (d.fitnessPreferences?.routineCadence)
            setRoutineCadence(d.fitnessPreferences.routineCadence);
          if (d.firstView) setFirstView(d.firstView);
        } else if (data.name) {
          setName(data.name);
          if (data.preferredName) setPreferredName(data.preferredName);
        }
      } catch (err) {
        console.warn("Failed to load onboarding draft:", err);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadOnboardingDraft();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Persist draft progressively to Supabase user metadata
  const persistDraft = async (targetStep: number) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDraft: true,
          step: targetStep,
          name: name.trim(),
          preferredName: preferredName.trim(),
          userType,
          mainGoals,
          primaryFocus,
          college: college.trim(),
          semester: semester.trim(),
          branch: branch.trim(),
          educationDetails: {
            institution: college.trim(),
            degreeBranch: branch.trim(),
            yearSemester: semester.trim(),
          },
          occupation: occupation.trim(),
          focusAreas,
          personalPreferences: { pace: workPace, reflection: reflectionPref },
          wakeUpTime,
          sleepTime,
          workingHoursStart,
          workingHoursEnd,
          availableHoursPerDay: availableHours,
          quietHoursStart,
          quietHoursEnd,
          reminderPreference: reminderPref,
          dailyRoutine: routineBlocks,
          startingBalance: balance ? parseFloat(balance) : null,
          monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
          currentSavings: currentSavings ? parseFloat(currentSavings) : null,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
          financialGoals: financialGoals.map((fg) => ({
            title: fg.title,
            targetAmount: fg.targetAmount,
          })),
          bikeTravelExpenses: bikeTravelExpenses
            ? parseFloat(bikeTravelExpenses)
            : null,
          tasks: tasks.map((t) => ({
            title: t.title,
            priority: t.priority,
            dueAt: t.dueAt || null,
            isRecurring: t.isRecurring,
            recurringFrequency: t.recurringFrequency,
            isPendingWork: t.isPendingWork,
          })),
          goals: goals.map((g) => ({
            title: g.title,
            type: g.type,
            category: g.category,
          })),
          habits: habits.map((h) => ({
            name: h.name,
            frequencyDays: h.frequencyDays,
            icon: h.icon,
            color: h.color,
          })),
          workoutTargetDays,
          fitnessPreferences: {
            workoutFocus,
            targetSleepHours,
            waterIntakeLiters,
            routineCadence,
          },
          firstView,
        }),
      });
    } catch (err) {
      console.warn("Draft persistence error:", err);
    }
  };

  // Validation before advancing
  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!name.trim()) {
        setValidationError("Please enter your full name so we can personalize your desk.");
        return;
      }
    }
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(nextStep);
    persistDraft(nextStep);
  };

  const handleSkip = () => {
    setValidationError(null);
    const nextStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(nextStep);
    persistDraft(nextStep);
  };

  const handleBack = () => {
    setValidationError(null);
    const prevStep = Math.max(step - 1, 1);
    setStep(prevStep);
    persistDraft(prevStep);
  };

  // Final submission
  const handleBuildDashboard = async () => {
    setLoading(true);
    setValidationError(null);

    confetti({
      particleCount: 110,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#1F6F6B", "#E0A458", "#38BDF8", "#34D399", "#FFFFFF"],
    });

    try {
      const payload = {
        name: name.trim(),
        preferredName: preferredName.trim(),
        userType,
        mainGoals,
        primaryFocus,
        college: college.trim(),
        semester: semester.trim(),
        branch: branch.trim(),
        educationDetails: {
          institution: college.trim(),
          degreeBranch: branch.trim(),
          yearSemester: semester.trim(),
        },
        occupation: occupation.trim(),
        focusAreas,
        personalPreferences: {
          pace: workPace,
          reflection: reflectionPref,
        },
        wakeUpTime,
        sleepTime,
        workingHoursStart,
        workingHoursEnd,
        availableHoursPerDay: availableHours,
        quietHoursStart,
        quietHoursEnd,
        reminderPreference: reminderPref,
        dailyRoutine: routineBlocks,
        startingBalance: balance ? parseFloat(balance) : null,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        currentSavings: currentSavings ? parseFloat(currentSavings) : null,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        financialGoals: financialGoals.map((fg) => ({
          title: fg.title,
          targetAmount: fg.targetAmount,
        })),
        bikeTravelExpenses: bikeTravelExpenses
          ? parseFloat(bikeTravelExpenses)
          : null,
        tasks: tasks.map((t) => ({
          title: t.title,
          priority: t.priority,
          dueAt: t.dueAt || null,
          isRecurring: t.isRecurring,
          recurringFrequency: t.recurringFrequency,
          isPendingWork: t.isPendingWork,
        })),
        goals: goals.map((g) => ({
          title: g.title,
          type: g.type,
          category: g.category,
        })),
        habits: habits.map((h) => ({
          name: h.name,
          frequencyDays: h.frequencyDays,
          icon: h.icon,
          color: h.color,
        })),
        workoutTargetDays,
        fitnessPreferences: {
          workoutFocus,
          targetSleepHours,
          waterIntakeLiters,
          routineCadence,
        },
        firstView,
        isOnboarded: true,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save onboarding configuration");
      }

      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (err: any) {
      console.error("Onboarding submission error:", err);
      setValidationError(
        err.message || "Failed to build your dashboard. Please try again."
      );
      setLoading(false);
    }
  };

  const isOptionalStep = step === 5 || step === 6 || step === 7;

  if (initialLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[2.5px] border-desk-amber border-t-transparent" />
          <p className="text-sm font-sans font-medium text-slate-200 tracking-wide">
            Preparing your personal workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ================= TOP NAVIGATION & PROGRESS ================= */}
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-white/[0.18] to-white/[0.04] border border-white/[0.22] shadow-[0_0_24px_rgba(224,164,88,0.22)]">
            <span className="font-sans font-bold text-base tracking-tight text-white">VR</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                VIRA <span className="font-normal text-slate-300">Life-OS</span>
              </h1>
              <span className="text-[11px] font-mono text-desk-amber font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-desk-amber/15 border border-desk-amber/30">
                Setup
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans font-medium">
              Step {step} of {TOTAL_STEPS} — {STEP_TITLES[step - 1]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>
      </header>

      {/* Apple Segmented Progress Indicator */}
      <div className="grid grid-cols-8 gap-1.5 w-full pt-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const isCompleted = i + 1 < step;
          const isCurrent = i + 1 === step;
          return (
            <div
              key={i}
              className="h-1.5 rounded-full overflow-hidden bg-white/[0.10]"
            >
              <motion.div
                className={`h-full rounded-full ${
                  isCompleted
                    ? "bg-desk-amber"
                    : isCurrent
                    ? "bg-gradient-to-r from-desk-teal via-teal-400 to-desk-amber"
                    : "bg-transparent"
                }`}
                initial={false}
                animate={{
                  width: isCompleted || isCurrent ? "100%" : "0%",
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          );
        })}
      </div>

      {/* ================= MAIN CONTAINER CARD ================= */}
      <div className="relative rounded-[28px] sm:rounded-[34px] bg-[#090E1A]/95 border border-white/[0.16] p-5 sm:p-8 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.22)] backdrop-blur-2xl overflow-hidden">
        {/* Specular Top Reflection Inset */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

        {/* Validation Alert */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="flex items-center gap-2.5 text-sm text-rose-200 bg-rose-500/[0.15] border border-rose-500/35 p-3.5 rounded-2xl font-sans">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="font-medium">{validationError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= STEP CONTENT CAROUSEL ================= */}
        <AnimatePresence mode="wait">
          {/* STEP 1: ABOUT YOU & PROFILE */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2">
                  <User className="h-3.5 w-3.5 text-desk-amber" />
                  <span>Identity & Profile</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Who is stepping up to this desk?
                </h2>
                <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                  Personalize your workspace for daily focus, projects, and routines.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Full Name & Preferred Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center justify-between">
                      <span>Your Full Name</span>
                      <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="e.g. Alex Chen or Sarah Miller"
                      className="w-full h-12 rounded-2xl bg-white/[0.09] hover:bg-white/[0.12] focus:bg-white/[0.15] px-4 text-base sm:text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:border-desk-amber focus:outline-none focus:ring-2 focus:ring-desk-amber/25 transition-all font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white flex items-center justify-between">
                      <span>Preferred Call Name</span>
                      <span className="text-xs font-mono text-slate-300">
                        Optional
                      </span>
                    </label>
                    <input
                      type="text"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      placeholder="e.g. Alex or Viswa"
                      className="w-full h-12 rounded-2xl bg-white/[0.09] hover:bg-white/[0.12] focus:bg-white/[0.15] px-4 text-base sm:text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:border-desk-teal-light focus:outline-none focus:ring-2 focus:ring-desk-teal-light/25 transition-all font-sans"
                    />
                  </div>
                </div>

                {/* What best describes you? */}
                <div className="space-y-2.5 pt-1">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>What best describes you?</span>
                    <span className="text-xs font-mono text-slate-300">Select one</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      "Student",
                      "Working Professional",
                      "Freelancer",
                      "Entrepreneur",
                      "Other",
                    ].map((type) => {
                      const isSelected = userType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setUserType(type);
                            if (type === "Student" && !focusAreas.includes("college")) {
                              setFocusAreas((prev) => [...prev, "college"]);
                            }
                          }}
                          className={`min-h-[44px] py-2.5 px-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? "bg-desk-amber/25 border-desk-amber text-white font-bold ring-1 ring-desk-amber/50 shadow-[0_0_18px_rgba(224,164,88,0.25)]"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.30] hover:text-white"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable Education Details when Student or College is selected */}
                <AnimatePresence>
                  {(userType === "Student" || focusAreas.includes("college")) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl bg-teal-500/[0.12] border border-teal-500/35 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                          <GraduationCap className="h-4 w-4" />
                          <span>Education & University Details</span>
                          <span className="text-xs font-mono font-normal text-slate-300">
                            (Optional)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="College / University"
                            className="h-11 rounded-xl bg-white/[0.09] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-teal-400 font-sans"
                          />
                          <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="Degree & Major (e.g. B.Tech CS)"
                            className="h-11 rounded-xl bg-white/[0.09] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-teal-400 font-sans"
                          />
                          <input
                            type="text"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            placeholder="Semester / Year (e.g. Sem 6)"
                            className="h-11 rounded-xl bg-white/[0.09] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-teal-400 font-sans"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Occupation / Current Role */}
                <div className="space-y-2 pt-1">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Occupation or Role</span>
                    <span className="text-xs font-mono text-slate-300">
                      Optional
                    </span>
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Software Engineer, Medical Student, Product Designer"
                    className="w-full h-12 rounded-2xl bg-white/[0.09] hover:bg-white/[0.12] focus:bg-white/[0.15] px-4 text-base sm:text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:border-desk-amber focus:outline-none focus:ring-2 focus:ring-desk-amber/25 transition-all font-sans"
                  />
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Software Engineer",
                      "College Student",
                      "Designer",
                      "Working Professional",
                      "Freelancer",
                      "Founder / Creator",
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setOccupation(sug)}
                        className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                          occupation === sug
                            ? "bg-desk-amber/25 border-desk-amber text-white font-bold"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:text-white hover:bg-white/[0.12]"
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: FOCUS AREAS & PRIMARY ANCHOR */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-300 uppercase tracking-wider mb-2">
                  <Target className="h-3.5 w-3.5 text-desk-teal-light" />
                  <span>Focus Areas</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Which areas of life do you want to manage?
                </h2>
                <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                  Select the pillars you want clarity and control over.
                </p>
              </div>

              <div className="space-y-5 pt-1">
                {/* Grid of 8 Life Areas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "college", label: "College & Studies", icon: BookOpen },
                    { id: "career", label: "Career & Projects", icon: Briefcase },
                    { id: "finances", label: "Finance & Budget", icon: IndianRupee },
                    { id: "goals", label: "Long-term Goals", icon: Target },
                    { id: "routines", label: "Routines & Habits", icon: Clock },
                    { id: "fitness", label: "Health & Fitness", icon: Dumbbell },
                    { id: "personal", label: "Personal Life", icon: HeartPulse },
                    { id: "tasks", label: "Daily Action Tasks", icon: CheckCircle2 },
                  ].map((area) => {
                    const isSelected = focusAreas.includes(area.id);
                    const Icon = area.icon;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleFocusArea(area.id)}
                        className={`flex flex-col items-start justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[96px] active:scale-[0.98] ${
                          isSelected
                            ? "bg-desk-teal/30 border-teal-400 text-white shadow-[0_0_20px_rgba(31,111,107,0.3)] ring-1 ring-teal-400/50"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.28] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon
                            className={`h-5 w-5 ${
                              isSelected ? "text-teal-300" : "text-slate-300"
                            }`}
                          />
                          {isSelected && (
                            <Check className="h-4 w-4 text-teal-300 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold leading-snug mt-2">
                          {area.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Focus Selector */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>What would you like to focus on first?</span>
                    <span className="text-xs font-mono text-slate-300">Initial anchor</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "Tasks", label: "Tasks" },
                      { id: "Finance", label: "Finance" },
                      { id: "Goals", label: "Goals" },
                      { id: "Habits", label: "Habits" },
                      { id: "Fitness", label: "Fitness" },
                      { id: "Career/Education", label: "Career & Study" },
                      { id: "Overall Life Management", label: "Overall Life-OS" },
                    ].map((item) => {
                      const isSelected = primaryFocus === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPrimaryFocus(item.id)}
                          className={`min-h-[44px] py-2.5 px-3 rounded-2xl border text-xs sm:text-sm font-medium transition-all text-center flex items-center justify-center cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? "bg-desk-amber/25 border-desk-amber text-white font-bold ring-1 ring-desk-amber/50 shadow-[0_0_16px_rgba(224,164,88,0.25)]"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.28] hover:text-white"
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: GOALS & RHYTHM */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-desk-amber" />
                  <span>Outcomes & Pace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Define your outcomes and daily pace
                </h2>
                <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                  Set your key intentions and the rhythm that keeps you in flow.
                </p>
              </div>

              <div className="space-y-5 pt-1">
                {/* Main Goals Multi-Select */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Key intentions for using VIRA</span>
                    <span className="text-xs font-mono font-semibold text-amber-300">
                      Multi-select
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "Build consistent daily habits & routines",
                      "Crush daily tasks with zero stress",
                      "Take control of personal finances & budget",
                      "Accelerate career, studies & high-value projects",
                      "Balance physical health, workouts & recovery",
                      "Maintain clarity, mindfulness & work-life harmony",
                    ].map((goalOption) => {
                      const isChecked = mainGoals.includes(goalOption);
                      return (
                        <button
                          key={goalOption}
                          type="button"
                          onClick={() => toggleMainGoal(goalOption)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[52px] active:scale-[0.98] ${
                            isChecked
                              ? "bg-desk-teal/30 border-teal-400 text-white shadow-[0_0_16px_rgba(31,111,107,0.25)] ring-1 ring-teal-400/40"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.28] hover:text-white"
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                              isChecked
                                ? "bg-desk-teal border-teal-300 text-white"
                                : "border-white/30 bg-white/5"
                            }`}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-medium leading-tight">
                            {goalOption}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Rhythm & Focus Vibe */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-sm font-semibold text-white">
                    Daily Rhythm & Focus Vibe
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "Structured & Focused",
                        desc: "Clear disciplined time blocks for deep work",
                      },
                      {
                        id: "Steady & Balanced",
                        desc: "Fluid, manageable flow throughout the day",
                      },
                      {
                        id: "Minimal & Calm",
                        desc: "Low cognitive load and zero unnecessary noise",
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setWorkPace(item.id)}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                          workPace === item.id
                            ? "bg-desk-amber/25 border-desk-amber text-white ring-1 ring-desk-amber/50 shadow-[0_0_20px_rgba(224,164,88,0.2)]"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.28]"
                        }`}
                      >
                        <p className="text-sm font-bold text-white">{item.id}</p>
                        <p className="text-xs text-slate-300 mt-1 leading-snug">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: DAILY SCHEDULE & ROUTINE */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-300 uppercase tracking-wider mb-2">
                  <Clock className="h-3.5 w-3.5 text-desk-teal-light" />
                  <span>Circadian Schedule</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Map your natural circadian rhythm
                </h2>
                <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                  Align your deep work, waking hours, and wind-down times without burnout.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Wake and Sleep Schedule Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sun className="h-4 w-4 text-amber-300" />
                      <span>Wake-up Time</span>
                    </div>
                    <input
                      type="time"
                      value={wakeUpTime}
                      onChange={(e) => setWakeUpTime(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/[0.1] px-3.5 text-base sm:text-sm font-mono font-semibold text-white border border-white/[0.2] focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Moon className="h-4 w-4 text-purple-300" />
                      <span>Sleep Time</span>
                    </div>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full h-11 rounded-xl bg-white/[0.1] px-3.5 text-base sm:text-sm font-mono font-semibold text-white border border-white/[0.2] focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* Working Hours & Focus Availability Slider */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      Working Hours & Daily Availability
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                      {availableHours} hrs focus / day
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        Work Start
                      </span>
                      <input
                        type="time"
                        value={workingHoursStart}
                        onChange={(e) => setWorkingHoursStart(e.target.value)}
                        className="w-full h-10 rounded-xl bg-white/[0.1] px-3 text-sm font-mono text-white border border-white/[0.2] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        Work End
                      </span>
                      <input
                        type="time"
                        value={workingHoursEnd}
                        onChange={(e) => setWorkingHoursEnd(e.target.value)}
                        className="w-full h-10 rounded-xl bg-white/[0.1] px-3 text-sm font-mono text-white border border-white/[0.2] focus:outline-none"
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min="4"
                    max="14"
                    step="1"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(Number(e.target.value))}
                    className="w-full accent-desk-amber cursor-pointer h-2 bg-white/[0.15] rounded-lg"
                  />
                </div>

                {/* Quiet Hours & Reminders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2">
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-desk-teal-light" />
                      <span>Quiet Hours (DND)</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        <span>Starts</span>
                        <input
                          type="time"
                          value={quietHoursStart}
                          onChange={(e) => setQuietHoursStart(e.target.value)}
                          className="w-full h-9 rounded-lg bg-white/[0.1] px-2 text-xs text-white border border-white/[0.16] mt-1"
                        />
                      </div>
                      <div>
                        <span>Ends</span>
                        <input
                          type="time"
                          value={quietHoursEnd}
                          onChange={(e) => setQuietHoursEnd(e.target.value)}
                          className="w-full h-9 rounded-lg bg-white/[0.1] px-2 text-xs text-white border border-white/[0.16] mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2">
                    <span className="text-sm font-semibold text-white">
                      Reminder Frequency
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {["Minimal", "Balanced", "Proactive"].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setReminderPref(lvl)}
                          className={`min-h-[40px] py-2 px-2 rounded-xl text-xs font-semibold font-mono transition-all border cursor-pointer ${
                            reminderPref === lvl
                              ? "bg-desk-teal/30 border-teal-400 text-teal-200 ring-1 ring-teal-400/40 shadow-sm"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:text-white"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Routine Blocks */}
                <div className="space-y-2.5 pt-1">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Typical Routine Blocks</span>
                    <span className="text-xs font-mono text-slate-300">Tap to toggle</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {routineBlocks.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleRoutineBlock(b)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-desk-teal/25 border border-teal-400/50 text-xs sm:text-sm font-medium text-white shadow-sm hover:border-teal-400 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>{b}</span>
                        <span className="text-slate-200 hover:text-rose-300 text-xs font-bold">
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>

                  <form onSubmit={addCustomRoutine} className="flex gap-2 pt-1.5">
                    <input
                      type="text"
                      value={customRoutineBlock}
                      onChange={(e) => setCustomRoutineBlock(e.target.value)}
                      placeholder="Add custom block (e.g. 🎧 Podcast Walk, 📖 Evening Reading)..."
                      className="flex-1 h-11 rounded-xl bg-white/[0.09] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-desk-teal font-sans"
                    />
                    <button
                      type="submit"
                      className="h-11 px-4 rounded-xl bg-white/[0.14] hover:bg-white/[0.2] text-white text-xs sm:text-sm font-semibold border border-white/[0.24] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: FINANCIAL SETUP (OPTIONAL) */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2">
                    <IndianRupee className="h-3.5 w-3.5 text-desk-amber" />
                    <span>Financial Health</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                    Budget & Spending Runway
                  </h2>
                  <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                    Track spending velocity, safe daily burn, and savings. All optional.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full shrink-0">
                  Optional
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* Monthly Budget Card */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Monthly Spending Budget</span>
                    {monthlyBudget && (
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Safe Daily: ₹{Math.round(parseFloat(monthlyBudget) / 30)}/day
                      </span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-mono text-lg font-bold text-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full h-13 rounded-2xl bg-white/[0.1] pl-9 pr-4 text-xl font-mono font-bold text-white border border-white/[0.22] focus:border-desk-amber focus:outline-none"
                    />
                  </div>
                  {/* Presets */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[15000, 30000, 50000, 75000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMonthlyBudget(preset.toString())}
                        className={`min-h-[40px] py-2 px-2 rounded-xl text-xs sm:text-sm font-mono font-semibold transition-all border cursor-pointer active:scale-95 ${
                          monthlyBudget === preset.toString()
                            ? "bg-desk-amber/25 border-desk-amber text-amber-300 ring-1 ring-desk-amber/50 shadow-sm"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:text-white hover:bg-white/[0.12]"
                        }`}
                      >
                        ₹{(preset / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standing Balances Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/[0.08] p-3.5 border border-white/[0.18] space-y-1.5">
                    <span className="text-xs font-semibold text-slate-100">
                      Available Balance
                    </span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-xs text-slate-300">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-10 rounded-xl bg-white/[0.1] pl-7 pr-3 text-sm font-mono text-white border border-white/[0.18] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.08] p-3.5 border border-white/[0.18] space-y-1.5">
                    <span className="text-xs font-semibold text-slate-100">
                      Monthly Income
                    </span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-xs text-slate-300">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-10 rounded-xl bg-white/[0.1] pl-7 pr-3 text-sm font-mono text-white border border-white/[0.18] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.08] p-3.5 border border-white/[0.18] space-y-1.5">
                    <span className="text-xs font-semibold text-slate-100">
                      Current Savings
                    </span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-xs text-slate-300">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={currentSavings}
                        onChange={(e) => setCurrentSavings(e.target.value)}
                        placeholder="Optional"
                        className="w-full h-10 rounded-xl bg-white/[0.1] pl-7 pr-3 text-sm font-mono text-white border border-white/[0.18] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bike and Commute Expenses */}
                <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2">
                  <label className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>Bike & Commute Expenses (Fuel, Transit, Maintenance)</span>
                    <span className="text-xs font-mono text-slate-300">
                      Monthly Est.
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-mono text-sm text-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={bikeTravelExpenses}
                      onChange={(e) => setBikeTravelExpenses(e.target.value)}
                      placeholder="e.g. 2500"
                      className="w-full h-11 rounded-xl bg-white/[0.1] pl-8 pr-3 text-base sm:text-sm font-mono text-white border border-white/[0.2] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Financial Goals Adder */}
                <div className="space-y-2.5 pt-1">
                  <label className="text-sm font-semibold text-white">
                    Savings & Financial Goals
                  </label>
                  {financialGoals.length > 0 && (
                    <div className="space-y-2">
                      {financialGoals.map((fg) => (
                        <div
                          key={fg.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.07] border border-white/[0.16] text-sm"
                        >
                          <span className="text-white font-medium">{fg.title}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-amber-300 font-bold">
                              ₹{fg.targetAmount.toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setFinancialGoals(
                                  financialGoals.filter((f) => f.id !== fg.id)
                                )
                              }
                              className="text-slate-300 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={addFinancialGoal}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1"
                  >
                    <input
                      type="text"
                      value={newFGoalTitle}
                      onChange={(e) => setNewFGoalTitle(e.target.value)}
                      placeholder="Goal (e.g. Travel Fund)"
                      className="h-11 rounded-xl bg-white/[0.1] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none"
                    />
                    <input
                      type="number"
                      value={newFGoalAmount}
                      onChange={(e) => setNewFGoalAmount(e.target.value)}
                      placeholder="Target Amount ₹"
                      className="h-11 rounded-xl bg-white/[0.1] px-3.5 text-sm font-mono text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="h-11 rounded-xl bg-white/[0.14] hover:bg-white/[0.2] text-white text-xs sm:text-sm font-semibold border border-white/[0.24] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Goal</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: TASKS & PRIORITIES (OPTIONAL) */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-300 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-desk-teal-light" />
                    <span>Action Items</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                    Capture today's priorities
                  </h2>
                  <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                    Add top tasks or important pending work. You can add more anytime.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full shrink-0">
                  Optional
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* Task Adder Card */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3.5">
                  <span className="text-sm font-semibold text-white">
                    Add a Task for Today or Backlog
                  </span>

                    <form onSubmit={addTask} className="space-y-3">
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="What needs to get done? (e.g. Ship v1 feature, Review notes)..."
                      className="w-full h-12 rounded-xl bg-white/[0.1] px-4 text-base sm:text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-desk-amber"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                      {/* Priority Selector */}
                      <div className="flex items-center gap-1.5">
                        {(["HIGH", "MEDIUM", "NORMAL"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTaskPriority(p)}
                            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer active:scale-95 ${
                              taskPriority === p
                                ? p === "HIGH"
                                  ? "bg-rose-500/30 border-rose-400 text-rose-200 ring-1 ring-rose-400/40 shadow-sm"
                                  : p === "MEDIUM"
                                  ? "bg-desk-amber/30 border-desk-amber text-amber-300 ring-1 ring-desk-amber/40 shadow-sm"
                                  : "bg-white/[0.2] border-white/40 text-white shadow-sm"
                                : "bg-white/[0.07] border-white/[0.16] text-slate-200 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      {/* Deadline Choice */}
                      <div className="flex items-center gap-1 text-xs font-mono">
                        {[
                          { id: "today", label: "Today" },
                          { id: "tomorrow", label: "Tomorrow" },
                        ].map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setTaskDeadline(d.id)}
                            className={`min-h-[36px] px-3.5 py-1 rounded-xl border font-semibold cursor-pointer active:scale-95 ${
                              taskDeadline === d.id
                                ? "bg-desk-teal/30 border-teal-400 text-teal-200 ring-1 ring-teal-400/40"
                                : "border-white/[0.18] bg-white/[0.07] text-slate-200"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>

                      {/* Pending Work Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                        <input
                          type="checkbox"
                          checked={taskIsPending}
                          onChange={(e) => setTaskIsPending(e.target.checked)}
                          className="accent-desk-amber h-4 w-4 rounded"
                        />
                        <span>Backlog item</span>
                      </label>

                      <button
                        type="submit"
                        className="min-h-[38px] px-4 rounded-xl bg-desk-amber hover:bg-amber-400 text-ink-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ml-auto"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </form>

                  {/* Added Tasks List */}
                  {tasks.length > 0 ? (
                    <div className="space-y-2 pt-3 border-t border-white/[0.12]">
                      {tasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.07] border border-white/[0.16] text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                t.priority === "HIGH"
                                  ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                                  : t.priority === "MEDIUM"
                                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                                  : "bg-slate-300"
                              }`}
                            />
                            <span className="text-white font-medium">{t.title}</span>
                            {t.isPendingWork && (
                              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                Backlog
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setTasks(tasks.filter((item) => item.id !== t.id))
                            }
                            className="text-slate-300 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 pt-1 text-center font-sans">
                      No tasks entered yet. You can add one or skip ahead.
                    </p>
                  )}
                </div>

                {/* Goal Adder Card */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3">
                  <span className="text-sm font-semibold text-white">
                    Short-Term & Long-Term Goals (Optional)
                  </span>

                  <form
                    onSubmit={addGoal}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2.5"
                  >
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="Goal (e.g. Build Portfolio, Learn Next.js)..."
                      className="sm:col-span-2 h-11 rounded-xl bg-white/[0.1] px-3.5 text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none"
                    />
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as any)}
                      className="h-11 rounded-xl bg-[#090D16] px-3 text-xs sm:text-sm text-white border border-white/[0.2] focus:outline-none"
                    >
                      <option value="SHORT_TERM">Short-Term (1-3m)</option>
                      <option value="LONG_TERM">Long-Term (6-12m)</option>
                    </select>
                    <button
                      type="submit"
                      className="h-11 rounded-xl bg-white/[0.14] hover:bg-white/[0.2] text-white text-xs sm:text-sm font-semibold border border-white/[0.24] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Goal</span>
                    </button>
                  </form>

                  {goals.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.12]">
                      {goals.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.07] border border-white/[0.16] text-sm"
                        >
                          <span className="text-white font-medium">{g.title}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                              {g.type === "SHORT_TERM" ? "Short-term" : "Long-term"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setGoals(goals.filter((item) => item.id !== g.id))
                              }
                              className="text-slate-300 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 7: HABITS & FITNESS (OPTIONAL) */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2">
                    <Flame className="h-3.5 w-3.5 text-desk-amber" />
                    <span>Habits & Wellness</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                    Design your daily consistency
                  </h2>
                  <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                    Build actions you can maintain. Real streaks that start at day zero.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full shrink-0">
                  Optional
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {/* Custom Habit Creator */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3.5">
                  <span className="text-sm font-semibold text-white">
                    Create a Habit
                  </span>

                  <form onSubmit={addHabit} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        placeholder="Habit name (e.g. Read 20 pages, Gym session, 3L water)..."
                        className="flex-1 h-12 rounded-xl bg-white/[0.1] px-4 text-base sm:text-sm text-white placeholder:text-slate-400 border border-white/[0.2] focus:outline-none focus:border-desk-amber"
                      />
                      <button
                        type="submit"
                        className="h-12 px-5 rounded-xl bg-desk-amber hover:bg-amber-400 text-ink-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                      {/* Target days per week */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">
                          Target frequency:
                        </span>
                        <div className="flex gap-1.5">
                          {[3, 4, 5, 7].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setHabitFrequency(days)}
                              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-mono font-bold border cursor-pointer active:scale-95 ${
                                habitFrequency === days
                                  ? "bg-desk-amber/30 border-desk-amber text-amber-300 ring-1 ring-desk-amber/40 shadow-sm"
                                  : "bg-white/[0.07] border-white/[0.18] text-slate-200"
                              }`}
                            >
                              {days}d/wk
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Icon Picker */}
                      <div className="flex items-center gap-1.5">
                        {["⚡", "🏋️", "📚", "💧", "🧘", "💻", "🏃"].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setHabitIcon(ic)}
                            className={`h-8 w-8 flex items-center justify-center rounded-xl text-sm transition-all cursor-pointer ${
                              habitIcon === ic
                                ? "bg-white/[0.25] scale-110 shadow-sm border border-white/40 ring-1 ring-white/50"
                                : "bg-white/[0.08] opacity-80 hover:opacity-100"
                            }`}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </form>

                  {/* Created Habits List */}
                  {habits.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.12]">
                      {habits.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.07] border border-white/[0.16] text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{h.icon}</span>
                            <div>
                              <p className="font-semibold text-white leading-tight">
                                {h.name}
                              </p>
                              <p className="text-xs font-mono text-slate-300">
                                {h.frequencyDays} days/week
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setHabits(habits.filter((item) => item.id !== h.id))
                            }
                            className="text-slate-300 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workout Targets */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-desk-teal-light" />
                      <span>Weekly Workout Target</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                      {workoutTargetDays} days / week
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {[0, 2, 3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setWorkoutTargetDays(days)}
                        className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all border cursor-pointer active:scale-95 ${
                          workoutTargetDays === days
                            ? "bg-desk-teal/30 border-teal-400 text-teal-200 ring-1 ring-teal-400/40 shadow-sm"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:text-white"
                        }`}
                      >
                        {days === 0 ? "Rest" : `${days}d`}
                      </button>
                    ))}
                  </div>

                  {/* Workout Focus Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Strength / Gym",
                      "Running & Cardio",
                      "Yoga & Flexibility",
                      "Home Workouts",
                      "Daily Brisk Walking",
                    ].map((wf) => (
                      <button
                        key={wf}
                        type="button"
                        onClick={() => setWorkoutFocus(wf)}
                        className={`text-xs font-sans px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                          workoutFocus === wf
                            ? "bg-desk-amber/25 border-desk-amber text-amber-200 font-semibold ring-1 ring-desk-amber/40"
                            : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:text-white"
                        }`}
                      >
                        {wf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleep & Hydration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        Target Sleep
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {targetSleepHours} hrs
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[7.0, 7.5, 8.0, 8.5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTargetSleepHours(s)}
                          className={`min-h-[36px] py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                            targetSleepHours === s
                              ? "bg-desk-amber/25 border-desk-amber text-amber-300 ring-1 ring-desk-amber/40"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-200 hover:text-white"
                          }`}
                        >
                          {s}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.08] p-4 border border-white/[0.18] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        Hydration Target
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-300">
                        {waterIntakeLiters} Liters
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[2.0, 2.5, 3.0, 3.5].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWaterIntakeLiters(w)}
                          className={`min-h-[36px] py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                            waterIntakeLiters === w
                              ? "bg-desk-teal/30 border-teal-400 text-teal-200 ring-1 ring-teal-400/40"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-200 hover:text-white"
                          }`}
                        >
                          {w}L
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 8: PERSONALIZE YOUR DASHBOARD */}
          {step === 8 && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-2">
                  <Sparkle className="h-3.5 w-3.5 text-desk-amber" />
                  <span>Final Polish</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Your personal Life-OS is ready
                </h2>
                <p className="text-sm sm:text-base text-slate-200 mt-1.5 leading-relaxed">
                  Choose what information you want to see first when you launch your workspace.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* First View Preference */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-white">
                    Default Opening View
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "today",
                        title: "Priority Tasks Today",
                        desc: "Top ranked focus items & backlog",
                        icon: CheckCircle2,
                        accent: "text-amber-300",
                      },
                      {
                        id: "money",
                        title: "Finances & Runway",
                        desc: "Daily safe spend & burn pace",
                        icon: IndianRupee,
                        accent: "text-teal-300",
                      },
                      {
                        id: "habits",
                        title: "Habits & Consistency",
                        desc: "Streaks with monthly grace days",
                        icon: Flame,
                        accent: "text-amber-400",
                      },
                    ].map((v) => {
                      const Icon = v.icon;
                      const isSelected = firstView === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setFirstView(v.id)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? "bg-desk-amber/25 border-desk-amber text-white ring-1 ring-desk-amber/50 shadow-[0_0_20px_rgba(224,164,88,0.25)]"
                              : "bg-white/[0.07] border-white/[0.18] text-slate-100 hover:bg-white/[0.12] hover:border-white/[0.28]"
                          }`}
                        >
                          <Icon className={`h-5 w-5 mb-2.5 ${v.accent}`} />
                          <h3 className="font-sans text-sm font-bold text-white leading-tight">
                            {v.title}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1.5 leading-snug">
                            {v.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Summary of Entered Information (Apple-style Review Card) */}
                <div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5 border border-white/[0.18] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/[0.12] pb-3">
                    <span className="font-sans text-sm font-bold text-white">
                      Desk Configuration Review
                    </span>
                    <span className="text-xs font-mono font-semibold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                      Ready to Launch
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm font-sans">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                        Identity & Persona
                      </span>
                      <p className="font-bold text-white text-base">
                        {name || "Personal User"}{" "}
                        {preferredName ? `(${preferredName})` : ""}
                      </p>
                      <p className="text-xs text-slate-200">
                        {userType} {occupation ? `• ${occupation}` : ""}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                        Daily Rhythm
                      </span>
                      <p className="font-mono font-bold text-white">
                        {wakeUpTime} wake • {sleepTime} sleep
                      </p>
                      <p className="text-xs text-slate-200">
                        {availableHours}h daily focus ({workingHoursStart} — {workingHoursEnd})
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                        Financial Setup
                      </span>
                      <p className="font-mono font-bold text-amber-300">
                        {monthlyBudget
                          ? `₹${parseFloat(monthlyBudget).toLocaleString("en-IN")}/mo budget`
                          : "Budget skipped"}
                      </p>
                      {bikeTravelExpenses && (
                        <p className="text-xs font-mono text-slate-200">
                          Commute: ₹{parseFloat(bikeTravelExpenses).toLocaleString("en-IN")}/mo
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                        Workload & Consistency
                      </span>
                      <p className="font-bold text-white">
                        {tasks.length} task{tasks.length !== 1 ? "s" : ""} •{" "}
                        {goals.length} goal{goals.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-slate-200">
                        {habits.length} habit{habits.length !== 1 ? "s" : ""} •{" "}
                        {workoutTargetDays}d/wk workouts
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= BOTTOM ACTION BAR ================= */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/[0.14] gap-3">
          {/* Left: Back Button */}
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[46px] px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.18] text-xs sm:text-sm font-semibold text-slate-100 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Right: Skip and Continue Buttons */}
          <div className="flex items-center gap-2.5">
            {isOptionalStep && (
              <button
                type="button"
                onClick={handleSkip}
                className="min-h-[46px] px-4 rounded-xl bg-transparent hover:bg-white/[0.08] text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <span>Skip for now</span>
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[46px] sm:min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-desk-amber to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_20px_rgba(224,164,88,0.35)] active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleBuildDashboard}
                className="min-h-[46px] sm:min-h-[48px] px-7 rounded-xl bg-gradient-to-r from-desk-teal via-teal-500 to-desk-amber hover:opacity-95 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_25px_rgba(31,111,107,0.45)] active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Configuring Desk...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-slate-950 stroke-[2.5]" />
                    <span>Launch VIRA Life-OS</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
