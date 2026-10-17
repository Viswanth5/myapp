"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Users, Zap, CheckCircle2, Flame, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

interface SquadMember {
  id: string;
  name: string;
  initials: string;
  course: string;
  status: "focusing" | "idle" | "done";
  activity: string;
  streak: number;
}

const INITIAL_SQUAD: SquadMember[] = [];

export const SquadCircleWidget: React.FC = () => {
  const [squad, setSquad] = useState<SquadMember[]>(INITIAL_SQUAD);
  const [nudgedId, setNudgedId] = useState<string | null>(null);

  const handleNudge = (id: string) => {
    setNudgedId(id);
    setTimeout(() => setNudgedId(null), 2000);
  };

  const activeFocusCount = squad.filter((m) => m.status === "focusing").length;

  return (
    <GlassCard level={1} className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Users className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-base font-medium text-white">Study Squad Circle</h3>
            <p className="text-[11px] font-mono text-slate-400">
              {activeFocusCount} friends currently in deep work
            </p>
          </div>
        </div>

        <Badge variant="teal" size="sm">
          {squad.length > 0 ? `Squad of ${squad.length}` : "Circle Ready"}
        </Badge>
      </div>

      {/* Squad Members List */}
      <div className="space-y-2.5">
        {squad.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <Users className="h-5 w-5 text-slate-500 mx-auto" />
            <p>No study or work squad connected yet.</p>
            <p className="text-[11px] text-slate-500">Invite peers to track mutual focus momentum.</p>
          </div>
        ) : (
          squad.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Avatar with Status Pulse */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/[0.1] border border-white/[0.2] flex items-center justify-center font-mono text-xs font-semibold text-slate-200">
                  {member.initials}
                </div>
                {member.status === "focusing" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-[#070B14] animate-pulse" />
                )}
                {member.status === "done" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#070B14]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-100">{member.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-0.5">
                    <Flame className="h-3 w-3 text-amber-400" /> {member.streak}d
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {member.activity}
                </p>
              </div>
            </div>

            {/* Micro Interaction */}
            <div>
              {nudgedId === member.id ? (
                <span className="text-[10px] font-mono text-teal-400 px-2 py-1 bg-teal-500/10 rounded-md">
                  Nudge Sent!
                </span>
              ) : (
                <button
                  onClick={() => handleNudge(member.id)}
                  title="Send silent nudge"
                  className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-slate-200 text-xs transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        )))}
      </div>
    </GlassCard>
  );
};
