import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const isOnboarded = data.user.user_metadata?.isOnboarded;

      // If user has not completed onboarding, direct them to onboarding
      if (isOnboarded !== true) {
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }

      // Validate redirect destination to avoid open-redirect vulnerabilities
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  // If error or no code provided, redirect to login with error flag
  return NextResponse.redirect(
    new URL("/login?error=Authentication%20session%20could%20not%20be%20established", requestUrl.origin)
  );
}
