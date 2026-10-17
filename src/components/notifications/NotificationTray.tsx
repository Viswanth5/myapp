"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrbitStore } from "@/store/useOrbitStore";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { Bell, Moon, Sun, Clock, X, Check, ArrowRight } from "lucide-react";

export const NotificationTray: React.FC = () => {
  const { isNotificationsOpen, setNotificationsOpen, setActiveTab } = useOrbitStore();

  const notifications = [
    {
      id: "notif-1",
      title: "🌅 Morning Plan Ready",
      body: "3 Must-Do submissions today. Top focus: DBMS Assignment 3 (due tmrw 5pm).",
      time: "8:00 AM",
      type: "BATCHED_PLAN",
      actionLabel: "View Today Stack",
      tab: "today" as const,
    },
    {
      id: "notif-2",
      title: "⚡ Exam Mode Alert",
      body: "DBMS Midsem is in 6 days. Today's syllabus chunk: 'Normalization & Functional Dependencies'.",
      time: "9:30 AM",
      type: "EXAM",
      actionLabel: "Open Exam Roadmap",
      tab: "study" as const,
    },
    {
      id: "notif-3",
      title: "🛡️ Streak Grace Reminder",
      body: "Daily LeetCode streak (14 days) is active. You have 1 monthly grace day remaining.",
      time: "Yesterday",
      type: "HABIT",
      actionLabel: "Check In",
      tab: "habits" as const,
    },
  ];

  if (!isNotificationsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setNotificationsOpen(false)}
          className="absolute inset-0 bg-ink-950/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0B1220]/95 backdrop-blur-2xl border border-white/[0.18] p-5 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.1] pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orbit-amber" />
              <h3 className="font-serif text-base font-semibold text-white">Quiet Notification Center</h3>
            </div>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quiet Hours Banner */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.04] p-2.5 border border-white/[0.08] text-xs text-slate-300">
            <Moon className="h-4 w-4 text-orbit-amber shrink-0" />
            <span className="text-[11px] font-mono">
              Quiet hours: 11:00 PM – 7:00 AM (Notifications batched calmly)
            </span>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="space-y-2 rounded-2xl bg-white/[0.04] p-3 border border-white/[0.08] hover:border-white/[0.18] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{n.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{n.body}</p>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setActiveTab(n.tab);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono font-medium text-orbit-amber hover:text-orbit-amber-light transition-colors"
                  >
                    <span>{n.actionLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
