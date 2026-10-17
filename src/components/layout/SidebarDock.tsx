"use client";

import React from "react";
import {
  Compass,
  CalendarDays,
  Coins,
  Flame,
  GraduationCap,
  History,
  SlidersHorizontal,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { useOrbitStore, NavTab } from "@/store/useOrbitStore";
import { useRouter, usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SidebarDock: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab, setActiveTab, setDumpOpen } = useOrbitStore();

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const tabs: Array<{ id: NavTab; label: string; icon: LucideIcon }> = [
    { id: "today", label: "Today", icon: Compass },
    { id: "plan", label: "Plan", icon: CalendarDays },
    { id: "money", label: "Money", icon: Coins },
    { id: "habits", label: "Habits", icon: Flame },
    { id: "study", label: "Study", icon: GraduationCap },
    { id: "rewind", label: "Rewind", icon: History },
  ];

  return (
    <>
      {/* Desktop Floating Left Dock (Level 2 Glass) */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-4 rounded-[28px] bg-white/[0.06] backdrop-blur-2xl p-2.5 border border-white/[0.14] shadow-glass-2">
        {/* Brand Orb Button */}
        <button
          onClick={() => handleTabClick("today")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-desk-teal to-desk-amber/80 text-canvas-950 font-serif font-bold text-lg shadow-teal-subtle hover:scale-105 transition-transform cursor-pointer"
          title="VIRA Home"
        >
          V
        </button>

        <div className="h-[1px] w-6 bg-white/[0.12] my-1" />

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === "/" && activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer select-none",
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]"
                )}
                title={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRailBadge"
                    className="absolute inset-0 rounded-2xl bg-white/[0.14] border border-white/[0.22] shadow-sm"
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" strokeWidth={1.5} />

                {/* Floating tooltip */}
                <span className="pointer-events-none absolute left-14 z-50 rounded-xl bg-canvas-950/95 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg border border-white/[0.14] backdrop-blur-md transition-opacity group-hover:opacity-100 whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="h-[1px] w-6 bg-white/[0.12] my-1" />

        {/* Quick Capture Trigger */}
        <button
          onClick={() => setDumpOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-desk-amber/20 hover:bg-desk-amber/30 text-desk-amber border border-desk-amber/30 shadow-amber-subtle transition-all cursor-pointer"
          title="Brain Dump (Cmd+K)"
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Settings */}
        <button
          onClick={() => handleTabClick("settings")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors text-slate-400 hover:text-white hover:bg-white/[0.08]",
            pathname === "/" && activeTab === "settings" ? "text-white bg-white/[0.12]" : ""
          )}
          title="Settings"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </aside>

      {/* Mobile Floating Bottom Dock (Level 3 Glass) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:hidden w-[92%] max-w-md">
        <div className="flex items-center justify-around rounded-full bg-[#070B14]/90 backdrop-blur-2xl p-1.5 border border-white/[0.16] shadow-glass-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === "/" && activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center justify-center rounded-full p-2.5 text-xs transition-all duration-200 cursor-pointer select-none",
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                )}
                title={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileBadge"
                    className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/[0.22]"
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" strokeWidth={1.5} />
              </button>
            );
          })}

          <button
            onClick={() => setDumpOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-desk-amber text-canvas-950 font-bold shadow-amber-subtle"
            title="Brain Dump"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </nav>
    </>
  );
};
