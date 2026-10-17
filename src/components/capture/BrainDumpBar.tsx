"use client";

import React, { useState } from "react";
import { Mic, ArrowRight, Sparkles } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";
import { GlassCard } from "@/components/ui/GlassCard";

export const BrainDumpBar: React.FC = () => {
  const { setDumpOpen, setDumpInput, setIsRecording } = useOrbitStore();
  const [localInput, setLocalInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    setDumpInput(localInput);
    setDumpOpen(true);
    setLocalInput("");
  };

  const handleVoice = () => {
    setIsRecording(true);
    setDumpOpen(true);
  };

  const samplePrompt = "DBMS assignment due friday 5pm, spent 180 on lunch, gym 3 times a week, save 5000 for laptop by december";

  return (
    <GlassCard level={3} className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-desk-teal animate-pulse" />
            <h2 className="font-serif text-lg sm:text-xl font-medium text-white tracking-tight">
              Conversational Desk Dump
            </h2>
          </div>
          <span className="text-[11px] font-mono tracking-mono text-slate-400 uppercase">
            Zero Manual Sorting
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Type anything freely: 'DBMS assignment due friday 5pm, spent 180 on lunch, gym 3x a week'..."
            className="w-full rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] px-4 py-3.5 pr-24 text-sm text-white placeholder-slate-400 border border-white/[0.12] focus:border-desk-amber/50 focus:outline-none focus:ring-2 focus:ring-desk-amber/20 backdrop-blur-xl transition-all shadow-inner font-sans"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleVoice}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white/[0.16] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Voice capture via Speech API"
            >
              <Mic className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="submit"
              disabled={!localInput.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-desk-amber hover:bg-desk-amber-glow disabled:opacity-30 disabled:pointer-events-none text-canvas-950 font-bold transition-all cursor-pointer shadow-amber-subtle"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Quick sample prompt chip */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setLocalInput(samplePrompt)}
            className="text-[11px] text-slate-400 hover:text-desk-amber-light underline-offset-4 hover:underline transition-colors text-left truncate max-w-[85%]"
          >
            Sample: "{samplePrompt.slice(0, 52)}..."
          </button>
          <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
            Auto-categorizes 4 items
          </span>
        </div>
      </form>
    </GlassCard>
  );
};
