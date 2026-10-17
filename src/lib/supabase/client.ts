import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://exqxfoyeidukneqvpeod.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_sSohTAtCHYLJCv2CDjSWCw_h0bb726x";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
