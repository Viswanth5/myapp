"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { GraduationCap, BookOpen, Clock, Calendar, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";

export const StudyView: React.FC = () => {
  const { refreshCounter, triggerRefresh } = useOrbitStore();
  const [activeTab, setActiveTab] = useState<"plans" | "courses">("plans");

  const { data, refetch } = useQuery({
    queryKey: ["study-full", refreshCounter],
    queryFn: async () => {
      const res = await fetch("/api/study");
      return res.json();
    },
  });

  const courses = data?.courses || [];
  const examPlans = data?.examPlans || [];

  const handleReflow = async (plan: any, missedDayNumber: number) => {
    try {
      await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, missedDayNumber }),
      });
      refetch();
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Study Hub & Learning Tracks
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Structured syllabus roadmaps and exam preparation with automated reflow
          </p>
        </div>
        <Badge variant="teal" size="md">
          Exam Mode Active
        </Badge>
      </div>

      {/* Active Exam Study Plans */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-medium text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-orbit-amber" />
          <span>Active Exam Mode Roadmaps</span>
        </h3>

        {examPlans.length === 0 ? (
          <GlassCard className="p-6 text-center text-slate-400">
            <p className="text-sm">No exams within 14 days. Enjoy regular study pace!</p>
          </GlassCard>
        ) : (
          examPlans.map((plan: any) => (
            <GlassCard key={plan.examId} variant="hero" className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.1] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-lg font-semibold text-white">{plan.examTitle}</h4>
                    <Badge variant="outline" size="sm">{plan.courseCode}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono pt-1">
                    Exam Date: {new Date(plan.examDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} • {plan.daysRemaining} days left
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="amber" size="sm">
                    {plan.dailyHoursNeeded} hrs / day recommended
                  </Badge>
                </div>
              </div>

              {/* Syllabus Daily Chunks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Daily Syllabus Chunks ({plan.chunks.length} Days)</span>
                  <span className="text-[11px] text-slate-500">Auto dynamic re-flow enabled</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {plan.chunks.map((chunk: any) => {
                    const isSkipped = chunk.isSkipped;

                    return (
                      <div
                        key={chunk.dayNumber}
                        className={`flex items-start justify-between rounded-2xl p-3 border text-xs transition-all ${
                          isSkipped
                            ? "bg-rose-500/10 border-rose-500/20 opacity-60 line-through text-slate-400"
                            : "bg-white/[0.04] border-white/[0.08] text-slate-200"
                        }`}
                      >
                        <div className="space-y-1 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-semibold text-orbit-amber">
                              Day {chunk.dayNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">({chunk.date})</span>
                          </div>
                          <p className="font-medium line-clamp-2">{chunk.topic}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {chunk.estimatedHours}h focus block
                          </span>
                        </div>

                        {!isSkipped && (
                          <button
                            onClick={() => handleReflow(plan, chunk.dayNumber)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-orbit-amber hover:bg-white/[0.08] transition-colors shrink-0"
                            title="Skip and re-distribute"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Courses & Modules List */}
      <div className="space-y-4 pt-4">
        <h3 className="font-serif text-xl font-medium text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orbit-teal" />
          <span>Enrolled Courses</span>
        </h3>

        {courses.length === 0 ? (
          <GlassCard className="p-8 text-center text-xs font-mono text-slate-400 space-y-1.5 border-white/[0.08]">
            <BookOpen className="h-6 w-6 text-slate-500 mx-auto stroke-[1.5]" />
            <p>No enrolled courses configured yet.</p>
            <p className="text-[11px] text-slate-500">Add course codes and assignments to monitor study roadmap pace.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map((course: any) => (
              <GlassCard key={course.id} variant="default" className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-orbit-teal-light">{course.code}</span>
                  <Badge variant="outline" size="sm">{course.credits} Credits</Badge>
                </div>
                <h4 className="font-serif text-sm font-semibold text-white line-clamp-2">{course.name}</h4>
                <p className="text-[11px] text-slate-400 font-mono">{course.professor || "Faculty"}</p>
                <div className="pt-2 border-t border-white/[0.08] text-[11px] font-mono text-slate-400">
                  {course.entries?.length || 0} active assignments
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
