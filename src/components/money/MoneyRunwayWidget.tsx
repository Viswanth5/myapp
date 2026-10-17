"use client";

import React from "react";
import { MoneyRunwayAnalysis } from "@/lib/engine/money";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { IndianRupee, AlertCircle } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";

interface MoneyRunwayWidgetProps {
  analysis?: MoneyRunwayAnalysis | null;
}

export const MoneyRunwayWidget: React.FC<MoneyRunwayWidgetProps> = ({ analysis }) => {
  const { setActiveTab } = useOrbitStore();
  if (!analysis) return null;

  return (
    <GlassCard
      level={1}
      onClick={() => setActiveTab("money")}
      className="p-5 space-y-4 cursor-pointer hover:border-white/[0.20] transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-item bg-desk-amber/20 text-desk-amber border border-desk-amber/30">
            <IndianRupee className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Money Runway</h3>
            <p className="text-[11px] font-mono tracking-mono text-slate-400 uppercase">Monthly Burn Pace</p>
          </div>
        </div>

        <Badge
          variant={analysis.budgetHealth === "critical" ? "critical" : "amber"}
          size="sm"
        >
          {analysis.runwayDays}d Runway
        </Badge>
      </div>

      {/* Main Metric Chips */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-card bg-white/[0.04] p-3 border border-white/[0.08]">
          <span className="text-[10px] font-mono tracking-mono text-slate-400 uppercase">Safe Daily Spend</span>
          <p className="font-mono text-xl font-bold text-desk-amber tabular-nums mt-0.5">
            ₹{analysis.dailySafeToSpend}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {analysis.daysRemainingInMonth}d left in month
          </span>
        </div>

        <div className="rounded-card bg-white/[0.04] p-3 border border-white/[0.08]">
          <span className="text-[10px] font-mono tracking-mono text-slate-400 uppercase">Balance</span>
          <p className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
            ₹{analysis.remainingBudget.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            of ₹{analysis.monthlyBudget.toLocaleString("en-IN")} budget
          </span>
        </div>
      </div>

      {/* Category Mini-Bars */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>Spent: ₹{analysis.totalSpentThisMonth.toLocaleString("en-IN")}</span>
          <span>{Math.round((analysis.totalSpentThisMonth / analysis.monthlyBudget) * 100)}%</span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08] flex">
          {analysis.categoryBreakdown.slice(0, 4).map((cat) => (
            <div
              key={cat.category}
              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              className="h-full transition-all"
              title={`${cat.category}: ₹${cat.amount}`}
            />
          ))}
        </div>
      </div>

      {analysis.driftAlert && (
        <div className="flex items-center gap-2 rounded-item bg-desk-amber/10 border border-desk-amber/20 p-2 text-[11px] text-amber-200">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-desk-amber" />
          <span className="truncate">{analysis.driftAlert}</span>
        </div>
      )}
    </GlassCard>
  );
};
