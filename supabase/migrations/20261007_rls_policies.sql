-- Row Level Security (RLS) Policies for Orbit Life-OS

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_rewinds ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policy
CREATE POLICY "Users can view and update own profile"
  ON public.users FOR ALL
  TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 3. Courses Policy
CREATE POLICY "Users can manage own courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 4. Entries Policy
CREATE POLICY "Users can manage own entries"
  ON public.entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 5. Habits Policy
CREATE POLICY "Users can manage own habits"
  ON public.habits FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 6. Habit Logs Policy
CREATE POLICY "Users can manage own habit logs"
  ON public.habit_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_logs.habit_id AND h.user_id = auth.uid()::text
    )
  );

-- 7. Goals Policy
CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 8. Recurring Spends Policy
CREATE POLICY "Users can manage own recurring spends"
  ON public.recurring_spends FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 9. Notifications Policy
CREATE POLICY "Users can manage own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- 10. Weekly Rewinds Policy
CREATE POLICY "Users can manage own rewinds"
  ON public.weekly_rewinds FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Allow Demo User Access for Guest Mode / Evaluation
CREATE POLICY "Allow demo user read access"
  ON public.users FOR SELECT
  TO anon
  USING (id = 'demo-user-1');

CREATE POLICY "Allow demo user entries read access"
  ON public.entries FOR SELECT
  TO anon
  USING (user_id = 'demo-user-1');
