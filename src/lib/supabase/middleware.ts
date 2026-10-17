import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://exqxfoyeidukneqvpeod.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_sSohTAtCHYLJCv2CDjSWCw_h0bb726x";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Check authenticated user
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/auth" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isOnboardingPage = pathname === "/onboarding";
  const isApiRoute = pathname.startsWith("/api");
  const isAuthCallback = pathname.startsWith("/auth/callback");

  // 1. If unauthenticated and accessing protected routes -> redirect to /login
  if (!user && !isAuthPage && !isApiRoute && !isAuthCallback && !isOnboardingPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const redirectRes = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
    return redirectRes;
  }

  // 2. If authenticated and accessing auth pages (login, signup, etc.)
  const isOnboarded = user?.user_metadata?.isOnboarded === true;
  if (user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isOnboarded ? "/" : "/onboarding";
    const redirectRes = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
    return redirectRes;
  }

  // 3. If authenticated user has not completed onboarding and tries to access dashboard
  if (user && !isOnboarded && !isOnboardingPage && !isApiRoute && !isAuthPage && !isAuthCallback) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    const redirectRes = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
    return redirectRes;
  }

  // 4. If authenticated user already completed onboarding and tries to access /onboarding
  if (user && isOnboarded && isOnboardingPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    const redirectRes = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((c) => redirectRes.cookies.set(c));
    return redirectRes;
  }

  // Update session and return response
  return response;
}
