-- ==============================================================================
-- Supabase PostgreSQL Schema & Security Policies for VIRA Life-OS
-- Run this script in your Supabase project's SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Users Profile Table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  "preferredName" TEXT DEFAULT '',
  "userType" TEXT DEFAULT '',
  "avatarUrl" TEXT,
  occupation TEXT DEFAULT '',
  "focusAreas" JSONB DEFAULT '[]'::jsonb,
  "mainGoals" JSONB DEFAULT '[]'::jsonb,
  "primaryFocus" TEXT DEFAULT '',
  "educationDetails" JSONB DEFAULT '{}'::jsonb,
  semester TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  college TEXT DEFAULT '',
  "weeklyFreeHours" DOUBLE PRECISION DEFAULT 28.0,
  "monthlyBudget" DOUBLE PRECISION DEFAULT 0.0,
  "startingBalance" DOUBLE PRECISION DEFAULT 0.0,
  currency TEXT DEFAULT 'INR',
  "quietHoursStart" TEXT DEFAULT '23:00',
  "quietHoursEnd" TEXT DEFAULT '07:00',
  "isOnboarded" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe migrations if public.users was already created previously in your project:
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "preferredName" TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "userType" TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "focusAreas" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "mainGoals" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "primaryFocus" TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "educationDetails" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS college TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "weeklyFreeHours" DOUBLE PRECISION DEFAULT 28.0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "monthlyBudget" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "startingBalance" DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "quietHoursStart" TEXT DEFAULT '23:00';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "quietHoursEnd" TEXT DEFAULT '07:00';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "isOnboarded" BOOLEAN DEFAULT false;

-- Courses / Academic Tracks
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1F6F6B',
  credits INTEGER DEFAULT 4,
  professor TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals & Milestones
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION DEFAULT 0.0,
  unit TEXT DEFAULT 'INR',
  category TEXT DEFAULT 'SAVINGS',
  deadline TIMESTAMP WITH TIME ZONE,
  color TEXT DEFAULT '#38BDF8',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habits & Routines
CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency_days INTEGER DEFAULT 3,
  streak_count INTEGER DEFAULT 0,
  grace_days_left INTEGER DEFAULT 2,
  monthly_grace_max INTEGER DEFAULT 2,
  color TEXT DEFAULT '#E0A458',
  icon TEXT DEFAULT '⚡',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit Daily Logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT true,
  used_grace BOOLEAN DEFAULT false,
  note TEXT
);

-- Recurring Spends & Allowances
CREATE TABLE IF NOT EXISTS public.recurring_spends (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  day_of_month INTEGER DEFAULT 1,
  category TEXT DEFAULT 'Personal',
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core Unified Entries (Tasks, Exams, Expenses, Incomes, Events)
CREATE TABLE IF NOT EXISTS public.entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- TASK, EXAM, EXPENSE, INCOME, HABIT, GOAL, EVENT
  title TEXT NOT NULL,
  description TEXT,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  due_at TIMESTAMP WITH TIME ZONE,
  start_at TIMESTAMP WITH TIME ZONE,
  effort_min INTEGER,
  weight DOUBLE PRECISION,
  amount DOUBLE PRECISION,
  category TEXT,
  status TEXT DEFAULT 'PENDING',
  priority_score DOUBLE PRECISION DEFAULT 0.0,
  carried_count INTEGER DEFAULT 0,
  snooze_count INTEGER DEFAULT 0,
  rescheduled_count INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT DEFAULT 'NONE',
  goal_id TEXT REFERENCES public.goals(id) ON DELETE SET NULL,
  habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'BATCHED_PLAN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Rewinds / Summaries
CREATE TABLE IF NOT EXISTS public.weekly_rewinds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_tasks INTEGER DEFAULT 0,
  carried_tasks INTEGER DEFAULT 0,
  total_spent DOUBLE PRECISION DEFAULT 0.0,
  habits_score DOUBLE PRECISION DEFAULT 0.0,
  focus_suggestions JSONB NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_entries_user_due_status ON public.entries (user_id, due_at, status);
CREATE INDEX IF NOT EXISTS idx_entries_user_type ON public.entries (user_id, type);
CREATE INDEX IF NOT EXISTS idx_courses_user ON public.courses (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits (user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON public.habit_logs (habit_id, date);
CREATE INDEX IF NOT EXISTS idx_recurring_spends_user ON public.recurring_spends (user_id, day_of_month);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_rewinds_user ON public.weekly_rewinds (user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read, insert, update, and delete their own records
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_rewinds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to allow safe re-runs
DROP POLICY IF EXISTS "Users can view and manage own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
DROP POLICY IF EXISTS "Users can manage own habit logs" ON public.habit_logs;
DROP POLICY IF EXISTS "Users can manage own recurring spends" ON public.recurring_spends;
DROP POLICY IF EXISTS "Users can manage own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage own weekly rewinds" ON public.weekly_rewinds;

-- Create Policies
CREATE POLICY "Users can view and manage own profile"
  ON public.users FOR ALL
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can manage own courses"
  ON public.courses FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own habits"
  ON public.habits FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own habit logs"
  ON public.habit_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own recurring spends"
  ON public.recurring_spends FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own entries"
  ON public.entries FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own weekly rewinds"
  ON public.weekly_rewinds FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ==============================================================================
-- 5. AUTOMATIC AUTH -> PUBLIC.USERS PROFILE SYNC TRIGGER
-- When a user registers in auth.users, automatically initialize public.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    "preferredName",
    "userType",
    occupation,
    "avatarUrl",
    "focusAreas",
    "mainGoals",
    "primaryFocus",
    "educationDetails",
    "isOnboarded"
  )
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'preferredName', ''),
    COALESCE(new.raw_user_meta_data->>'userType', ''),
    COALESCE(new.raw_user_meta_data->>'occupation', ''),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->'focusAreas')::jsonb, '[]'::jsonb),
    COALESCE((new.raw_user_meta_data->'mainGoals')::jsonb, '[]'::jsonb),
    COALESCE(new.raw_user_meta_data->>'primaryFocus', ''),
    COALESCE((new.raw_user_meta_data->'educationDetails')::jsonb, '{}'::jsonb),
    COALESCE((new.raw_user_meta_data->>'isOnboarded')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    "preferredName" = COALESCE(NULLIF(EXCLUDED."preferredName", ''), public.users."preferredName"),
    "userType" = COALESCE(NULLIF(EXCLUDED."userType", ''), public.users."userType"),
    occupation = COALESCE(NULLIF(EXCLUDED.occupation, ''), public.users.occupation),
    "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public.users."avatarUrl"),
    "updatedAt" = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. ENABLE SUPABASE REALTIME (Optional, for instant live dashboard sync)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Safe ignore if publication does not exist or table already in publication
END $$;
