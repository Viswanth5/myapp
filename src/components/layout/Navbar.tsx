"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Command,
  Clock,
  Sparkles,
  SlidersHorizontal,
  LogOut,
  LogIn,
  User,
  Compass,
  CalendarDays,
  Coins,
  Flame,
  GraduationCap,
  History,
} from "lucide-react";
import { useOrbitStore, NavTab } from "@/store/useOrbitStore";
import { GlassButton } from "@/components/ui/GlassButton";

const TAB_TITLES: Record<NavTab, { label: string; icon: any }> = {
  today: { label: "Today Desk", icon: Compass },
  plan: { label: "Schedule & Planner", icon: CalendarDays },
  money: { label: "Money Runway", icon: Coins },
  habits: { label: "Goals & Habits", icon: Flame },
  study: { label: "Study Hub", icon: GraduationCap },
  rewind: { label: "Weekly Rewind", icon: History },
  settings: { label: "Settings", icon: SlidersHorizontal },
};

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    activeTab,
    setActiveTab,
    setDumpOpen,
    setNotificationsOpen,
  } = useOrbitStore();

  const [dayName, setDayName] = useState("Today");
  const [dateFormatted, setDateFormatted] = useState("");
  const [timeFormatted, setTimeFormatted] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setCurrentUser(data?.user || null);

        // Fetch fresh profile from /api/user for immediate updates
        const res = await fetch("/api/user");
        if (res.ok) {
          const ud = await res.json();
          setUserProfile(ud?.user || null);
        }
      } catch {
        setCurrentUser(null);
        setUserProfile(null);
      }
    };
    checkUser();
  }, [pathname]);

  // Clean real user display name (strictly rejecting any fictional legacy placeholders)
  const rawPreferred = userProfile?.preferredName?.trim() || currentUser?.user_metadata?.preferredName?.trim() || "";
  const rawName = userProfile?.name?.trim() || currentUser?.user_metadata?.name?.trim() || "";
  const cleanPreferred = /^aarav(\s+sharma)?$/i.test(rawPreferred) ? "" : rawPreferred;
  const cleanName = /^aarav(\s+sharma)?$/i.test(rawName) ? "" : rawName;
  const displayName = cleanPreferred || cleanName || "";

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDayName(now.toLocaleDateString("en-IN", { weekday: "long" }));
      setDateFormatted(
        now.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      );
      setTimeFormatted(
        now.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Cmd/Ctrl+K for AI Quick Capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDumpOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDumpOpen]);

  const handleOpenSettings = () => {
    setActiveTab("settings");
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const currentTabInfo = TAB_TITLES[activeTab] || TAB_TITLES.today;
  const ActiveIcon = currentTabInfo.icon;

  return (
    <header className="w-full pt-3 pb-3 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/[0.06] pb-3">
        {/* Left: Sleek Brand & Workspace Indicator (Eliminates duplicate section titles) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab("today");
              if (pathname !== "/") router.push("/");
            }}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-desk-teal to-desk-amber/80 text-canvas-950 font-serif font-bold text-base shadow-teal-subtle hover:scale-105 transition-transform cursor-pointer"
            title="VIRA Home"
          >
            V
          </button>

          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold text-white tracking-tight">
              VIRA
            </span>
            <span className="text-slate-600 font-mono text-xs">/</span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
              <ActiveIcon className="h-3 w-3 text-desk-amber" />
              <span>{currentTabInfo.label}</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 pl-2 border-l border-white/[0.08]">
            <span>{dayName},</span>
            <span className="text-slate-300">{dateFormatted}</span>
          </div>
        </div>

        {/* Right Action Bar: Time, AI Button, Notification, Settings, Sign Out */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 self-start sm:self-center">
          {/* Live Time Ticker Pill */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 backdrop-blur-md text-xs font-mono select-none"
            title={`Local Time: ${timeFormatted}`}
          >
            <Clock
              className="h-3.5 w-3.5 text-desk-amber animate-pulse"
              strokeWidth={1.5}
            />
            <span className="text-slate-300 tabular-nums">
              {timeFormatted || "--:--:--"}
            </span>
          </div>

          {/* AI Quick Capture Trigger */}
          <button
            onClick={() => setDumpOpen(true)}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-desk-amber/25 via-desk-amber/15 to-white/[0.06] hover:from-desk-amber/35 hover:to-white/[0.12] px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs text-white border border-desk-amber/40 hover:border-desk-amber/60 backdrop-blur-md transition-all shadow-glass-1 cursor-pointer select-none"
            title="AI Quick Capture (Press ⌘K or Ctrl+K)"
          >
            <Sparkles
              className="h-3.5 w-3.5 text-desk-amber group-hover:scale-110 group-hover:rotate-12 transition-transform"
              strokeWidth={2}
            />
            <span className="font-medium tracking-tight">AI Quick Capture</span>
            <kbd className="hidden sm:flex items-center gap-0.5 rounded bg-black/40 border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono text-desk-amber">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>

          {/* Quiet Notifications Bell */}
          <GlassButton
            variant="secondary"
            size="icon"
            onClick={() => setNotificationsOpen(true)}
            className="relative hover:bg-white/[0.12] transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4 text-slate-200" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-desk-amber animate-pulse shadow-sm" />
          </GlassButton>

          {/* Settings / Preferences */}
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={handleOpenSettings}
            className={`transition-colors text-slate-400 hover:text-white hover:bg-white/[0.12] ${
              pathname === "/" && activeTab === "settings"
                ? "bg-white/[0.16] text-white border border-white/[0.2]"
                : ""
            }`}
            title="System Settings & Preferences"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </GlassButton>

          {/* User Profile Pill (Dynamic Real User Name or Neutral Profile) */}
          {currentUser && (
            <button
              onClick={handleOpenSettings}
              className="flex items-center gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] pl-1.5 pr-3 py-1 text-xs font-mono text-slate-200 transition-all cursor-pointer"
              title="View Profile & Settings"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-desk-teal text-[10px] font-bold text-white uppercase">
                {displayName ? (
                  displayName.charAt(0)
                ) : (
                  <User className="h-3 w-3 text-white" />
                )}
              </div>
              <span className="max-w-[120px] truncate font-medium">
                {displayName || "Profile"}
              </span>
            </button>
          )}

          {/* Sign In / Sign Out */}
          {currentUser ? (
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signOut();
                setCurrentUser(null);
                window.location.href = "/login";
              }}
              className="text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </GlassButton>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm select-none"
              title="Sign in to your VIRA account"
            >
              <LogIn className="h-3.5 w-3.5 text-desk-amber" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
