-- Enable Supabase Realtime Replication on Entries Table

ALTER TABLE public.entries REPLICA IDENTITY FULL;

-- Add entries table to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
  END IF;
END $$;
