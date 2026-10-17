"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { SlidersHorizontal, Moon, IndianRupee, Clock, Check, RefreshCw } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";

export const SettingsView: React.FC = () => {
  const { refreshCounter, triggerRefresh } = useOrbitStore();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: userData, refetch } = useQuery({
    queryKey: ["user", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/user");
      return res.json();
    },
  });

  const user = userData?.user;

  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [college, setCollege] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [freeHours, setFreeHours] = useState("28");
  const [budget, setBudget] = useState("0");
  const [quietStart, setQuietStart] = useState("23:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  React.useEffect(() => {
    if (user) {
      if (user.name !== undefined) setFullName(user.name);
      if (user.preferredName !== undefined) setPreferredName(user.preferredName);
      if (user.occupation !== undefined) setOccupation(user.occupation);
      if (user.college !== undefined) setCollege(user.college);
      if (user.semester !== undefined) setSemester(user.semester);
      if (user.branch !== undefined) setBranch(user.branch);
      if (user.weeklyFreeHours !== undefined) setFreeHours(user.weeklyFreeHours.toString());
      if (user.monthlyBudget !== undefined) setBudget(user.monthlyBudget.toString());
      if (user.quietHoursStart) setQuietStart(user.quietHoursStart);
      if (user.quietHoursEnd) setQuietEnd(user.quietHoursEnd);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          preferredName,
          occupation,
          college,
          semester,
          branch,
          weeklyFreeHours: parseFloat(freeHours) || 28,
          monthlyBudget: parseFloat(budget) || 0,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      refetch();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = (preferredName || fullName || "").trim();

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Settings & Life Parameters
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Calibrate VIRA to your personal schedule, free hours, and budget
          </p>
        </div>
        <Badge variant="teal" size="md">
          {displayName || "Profile Parameters"}
        </Badge>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {/* Profile Details */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <h3 className="font-serif text-lg font-medium text-white">Profile Identity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Preferred Name (Greeting)</label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-slate-300 font-medium">Occupation / Primary Role</label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Student, Software Engineer, Designer, Freelancer"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
          </div>
        </GlassCard>

        {/* Academic / Education Settings */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <h3 className="font-serif text-lg font-medium text-white">Education & Institutional Track</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">College / Institution</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. University / College"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Current Semester / Year</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Semester 5 or Year 3"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Branch / Major</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CS, Economics, Design"
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30"
              />
            </div>
          </div>
        </GlassCard>

        {/* Workload & Budget */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <h3 className="font-serif text-lg font-medium text-white">Capacity & Budget</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Weekly Available Free Hours</label>
              <input
                type="number"
                value={freeHours}
                onChange={(e) => setFreeHours(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Used to compute the Pressure Meter
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Monthly Living Budget (₹)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-2xl bg-white/[0.05] p-3 text-white border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-orbit-amber/30 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                Drives Daily Safe-to-Spend calculations
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Quiet Hours */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-orbit-amber" />
            <h3 className="font-serif text-lg font-medium text-white">Quiet Hours & Smart Moments</h3>
          </div>
          <p className="text-xs text-slate-400">
            Reminders are silenced during quiet hours and batched into 2 calm moments per day.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Start Quiet Hours</label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full rounded-2xl bg-[#090D16] p-3 text-white border border-white/[0.12] focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">End Quiet Hours</label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full rounded-2xl bg-[#090D16] p-3 text-white border border-white/[0.12] focus:outline-none font-mono"
              />
            </div>
          </div>
        </GlassCard>

        {/* System & Calendar Utilities */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-orbit-teal" />
            <h3 className="font-serif text-lg font-medium text-white">System Tools & Calendar Sync</h3>
          </div>
          <p className="text-xs text-slate-400">
            Export your life desk to external calendars or manually trigger midnight rollover calculations.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="/api/calendar/export"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-xs font-mono text-slate-200 transition-all cursor-pointer"
            >
              <Clock className="h-4 w-4 text-orbit-amber" />
              Download Calendar (.ics)
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/nightly", { method: "POST" });
                  const data = await res.json();
                  alert(`Midnight job executed: ${data.message}`);
                  triggerRefresh();
                } catch (e) {
                  alert("Error running nightly job");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-xs font-mono text-slate-200 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-orbit-teal" />
              Run Nightly Rollover Now
            </button>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-orbit-teal font-mono">
              <Check className="h-4 w-4" /> Parameters saved successfully!
            </span>
          )}
          <div className="ml-auto">
            <GlassButton variant="accent" size="md" type="submit">
              Save Preferences
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
};
