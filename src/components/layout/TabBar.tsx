"use client";

import React from "react";
import {
  Compass,
  CalendarDays,
  Coins,
  Flame,
  GraduationCap,
  History,
  LucideIcon,
} from "lucide-react";
import { useOrbitStore, NavTab } from "@/store/useOrbitStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useOrbitStore();

  const tabs: Array<{ id: NavTab; label: string; icon: LucideIcon }> = [
    { id: "today", label: "Today", icon: Compass },
    { id: "plan", label: "Plan", icon: CalendarDays },
    { id: "money", label: "Money", icon: Coins },
    { id: "habits", label: "Habits & Goals", icon: Flame },
    { id: "study", label: "Study", icon: GraduationCap },
    { id: "rewind", label: "Rewind", icon: History },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-xl">
      <div className="flex items-center justify-around rounded-full bg-[#080D17]/85 backdrop-blur-2xl p-1.5 border border-white/[0.16] shadow-glass-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200 cursor-pointer select-none",
                isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 rounded-full bg-white/[0.12] border border-white/[0.22] shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" strokeWidth={1.5} />
              <span className="relative z-10 hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
