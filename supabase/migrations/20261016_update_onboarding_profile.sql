-- ==============================================================================
-- DELTA MIGRATION: Onboarding Profile & Dashboard Personalization
-- Run ONLY this snippet in Supabase SQL Editor if you already ran the initial setup
-- ==============================================================================

-- 1. Add new profile and onboarding fields to public.users (safe & non-destructive)
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

-- 2. Update the Auth Sync Trigger Function to map all new onboarding fields
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

-- 3. Re-apply trigger to ensure it listens to both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Clean up any legacy demo defaults in public.users
ALTER TABLE public.users ALTER COLUMN name SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN semester SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN branch SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN college SET DEFAULT '';
ALTER TABLE public.users ALTER COLUMN "isOnboarded" SET DEFAULT false;

UPDATE public.users
SET name = COALESCE(NULLIF(raw_meta.name, ''), '')
FROM (
  SELECT id, (raw_user_meta_data->>'name') as name, (raw_user_meta_data->>'preferredName') as preferredName
  FROM auth.users
) as raw_meta
WHERE public.users.id = raw_meta.id
  AND (public.users.name = 'Aarav Sharma' OR public.users.name IS NULL);

