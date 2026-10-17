"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeEntries() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only subscribe if a valid Supabase project URL is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("demo.supabase.co")) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel("realtime-entries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entries",
        },
        () => {
          // Live sync invalidation across tabs & devices
          queryClient.invalidateQueries({ queryKey: ["today"] });
          queryClient.invalidateQueries({ queryKey: ["radar"] });
          queryClient.invalidateQueries({ queryKey: ["pressure"] });
          queryClient.invalidateQueries({ queryKey: ["money"] });
          queryClient.invalidateQueries({ queryKey: ["study"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
