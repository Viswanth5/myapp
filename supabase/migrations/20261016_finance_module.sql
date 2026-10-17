-- ==============================================================================
-- DELTA MIGRATION: Finance Module (Transactions, Budgets, Recurring & Bike Logs)
-- Run ONLY this snippet in Supabase SQL Editor to upgrade the Finance system
-- ==============================================================================

-- 1. Add category budgets to public.users if not already present
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "categoryBudgets" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "financialPreferences" JSONB DEFAULT '{}'::jsonb;

-- 2. Enhance public.recurring_spends with frequency, status, next_due_date, and notes
ALTER TABLE public.recurring_spends ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'MONTHLY';
ALTER TABLE public.recurring_spends ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.recurring_spends ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.recurring_spends ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Dedicated Bike & Travel Logs Table
CREATE TABLE IF NOT EXISTS public.bike_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bike_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'FUEL', -- 'FUEL', 'SERVICE', 'EXPENSE'
  litres DOUBLE PRECISION,
  fuel_price_per_litre DOUBLE PRECISION,
  amount DOUBLE PRECISION NOT NULL,
  odometer DOUBLE PRECISION,
  distance DOUBLE PRECISION,
  service_type TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_bike_logs_user_date ON public.bike_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_spends_user_status ON public.recurring_spends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entries_user_type_due ON public.entries(user_id, type, due_at DESC);

-- 5. Row-Level Security (RLS) Policies for bike_logs
ALTER TABLE public.bike_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_logs' AND policyname = 'Users can view their own bike logs'
  ) THEN
    CREATE POLICY "Users can view their own bike logs" ON public.bike_logs
      FOR SELECT USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_logs' AND policyname = 'Users can insert their own bike logs'
  ) THEN
    CREATE POLICY "Users can insert their own bike logs" ON public.bike_logs
      FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_logs' AND policyname = 'Users can update their own bike logs'
  ) THEN
    CREATE POLICY "Users can update their own bike logs" ON public.bike_logs
      FOR UPDATE USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bike_logs' AND policyname = 'Users can delete their own bike logs'
  ) THEN
    CREATE POLICY "Users can delete their own bike logs" ON public.bike_logs
      FOR DELETE USING (auth.uid()::text = user_id);
  END IF;
END $$;
