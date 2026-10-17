-- Supabase PostgreSQL Schema for Orbit Life-OS

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  "avatarUrl" TEXT,
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

CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#1F6F6B',
  credits INTEGER DEFAULT 4,
  professor TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS public.habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency_days INTEGER DEFAULT 3,
  streak_count INTEGER DEFAULT 0,
  grace_days_left INTEGER DEFAULT 2,
  monthly_grace_max INTEGER DEFAULT 2,
  color TEXT DEFAULT '#E0A458',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT true,
  used_grace BOOLEAN DEFAULT false,
  note TEXT
);

CREATE TABLE IF NOT EXISTS public.recurring_spends (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  day_of_month INTEGER DEFAULT 5,
  category TEXT DEFAULT 'Mess',
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
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
  goal_id TEXT REFERENCES public.goals(id) ON DELETE SET NULL,
  habit_id TEXT REFERENCES public.habits(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'BATCHED_PLAN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.weekly_rewinds (
  id TEXT PRIMARY KEY,
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
