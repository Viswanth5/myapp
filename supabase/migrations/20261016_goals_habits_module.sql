-- ==============================================================================
-- DELTA MIGRATION: Goals & Habits Module
-- Run ONLY this snippet in Supabase SQL Editor to upgrade Goals & Habits
-- ==============================================================================

-- 1. Enhance public.goals with description, priority, status, tracking type, and milestones metadata
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'MEDIUM';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN_PROGRESS';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS tracking_type TEXT DEFAULT 'MILESTONE';
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Enhance public.habits with description, frequency type, target days of week, reminder time, status, and best streak
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Personal';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS frequency_type TEXT DEFAULT 'DAILY';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS target_days_of_week JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT 1;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time TEXT;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Enhance public.habit_logs with created_at timestamp
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. High-Performance Indices & Unique Constraints (prevent duplicate habit logs on same date)
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habits_user_status ON public.habits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entries_goal_id ON public.entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_entries_habit_id ON public.entries(habit_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON public.habit_logs(habit_id, date);
