"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Zap, Battery, BatteryCharging, BatteryFull } from "lucide-react";

export const EnergyMapWidget: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<"low" | "steady" | "peak">("peak");

  return (
    <GlassCard level={1} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-desk-amber" />
          <h3 className="font-serif text-base font-semibold text-white">Circadian Energy Map</h3>
        </div>
        <Badge variant="amber" size="sm">Peak Focus Window</Badge>
      </div>

      <p className="text-[11px] text-slate-300">
        How is your energy right now? VIRA schedules deep work into your peak cognitive hours.
      </p>

      {/* 3-State Energy Tap Selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setSelectedLevel("low")}
          className={`flex items-center justify-center gap-1.5 rounded-item p-2 text-xs border transition-all cursor-pointer ${
            selectedLevel === "low"
              ? "bg-slate-700/40 border-slate-400 text-white font-semibold"
              : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
          }`}
        >
          <Battery className="h-3.5 w-3.5 text-slate-400" />
          <span>Low</span>
        </button>

        <button
          onClick={() => setSelectedLevel("steady")}
          className={`flex items-center justify-center gap-1.5 rounded-item p-2 text-xs border transition-all cursor-pointer ${
            selectedLevel === "steady"
              ? "bg-desk-teal/30 border-desk-teal text-white font-semibold shadow-teal-subtle"
              : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
          }`}
        >
          <BatteryCharging className="h-3.5 w-3.5 text-desk-teal-light" />
          <span>Steady</span>
        </button>

        <button
          onClick={() => setSelectedLevel("peak")}
          className={`flex items-center justify-center gap-1.5 rounded-item p-2 text-xs border transition-all cursor-pointer ${
            selectedLevel === "peak"
              ? "bg-desk-amber/30 border-desk-amber text-white font-semibold shadow-amber-subtle"
              : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
          }`}
        >
          <BatteryFull className="h-3.5 w-3.5 text-desk-amber" />
          <span>Peak Focus</span>
        </button>
      </div>

      <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/[0.08]">
        Historical peak: 2:00 PM – 5:30 PM (Allocated for DBMS & OS deep work)
      </div>
    </GlassCard>
  );
};
