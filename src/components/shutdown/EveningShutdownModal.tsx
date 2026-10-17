"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { Moon, Sparkles, CheckCircle2, ArrowRight, Check, X } from "lucide-react";
import confetti from "canvas-confetti";

interface EveningShutdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  carriedCount: number;
  onBrainDump: (text: string) => void;
  userName?: string;
  quietHoursEnd?: string;
}

export const EveningShutdownModal: React.FC<EveningShutdownModalProps> = ({
  isOpen,
  onClose,
  completedCount,
  carriedCount,
  onBrainDump,
  userName,
  quietHoursEnd,
}) => {
  const [step, setStep] = useState(1);
  const [offloadText, setOffloadText] = useState("");
  const [fetchedName, setFetchedName] = useState("");
  const [fetchedQuietEnd, setFetchedQuietEnd] = useState("");

  React.useEffect(() => {
    if (isOpen && !userName) {
      fetch("/api/user")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setFetchedName(data.user.preferredName || data.user.name || "");
            if (data.user.quietHoursEnd) setFetchedQuietEnd(data.user.quietHoursEnd);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, userName]);

  const cleanName = (userName || fetchedName || "").trim();
  const effectiveQuietEnd = quietHoursEnd || fetchedQuietEnd || "7:00 AM";

  const handleFinish = () => {
    if (offloadText.trim()) {
      onBrainDump(offloadText);
    }
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#E0A458", "#1F6F6B", "#BAE6FD"],
    });
    setStep(4);
    setTimeout(() => {
      onClose();
      setStep(1);
      setOffloadText("");
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-950/85 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative z-10 w-full max-w-lg rounded-panel bg-[#0B101D] border border-desk-amber/30 p-6 sm:p-8 shadow-glass-3 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-item bg-desk-amber/20 text-desk-amber border border-desk-amber/30">
                <Moon className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-semibold text-white">Evening Shutdown Ritual</span>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step 1: Celebration & Review */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-white">
                Closing today's horizon
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You crossed off <span className="text-desk-teal-light font-bold">{completedCount || 4} submissions & study blocks</span> today.
                {carriedCount > 0 ? ` ${carriedCount} item(s) will gently roll over to tomorrow without penalty.` : " Zero rollover stress."}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-card bg-white/[0.04] p-3 border border-white/[0.08] text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Completed Today</span>
                  <p className="font-mono text-2xl font-bold text-desk-teal-light mt-0.5">{completedCount || 4}</p>
                </div>
                <div className="rounded-card bg-white/[0.04] p-3 border border-white/[0.08] text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Grace Days Safe</span>
                  <p className="font-mono text-2xl font-bold text-desk-amber mt-0.5">2 Left</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <GlassButton variant="accent" size="md" onClick={() => setStep(2)}>
                  <span>Next: Brain Offload</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </GlassButton>
              </div>
            </div>
          )}

          {/* Step 2: Brain Offload */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-white">
                What's still on your mind before sleep?
              </h3>
              <p className="text-xs text-slate-400">
                Dump any last-minute reminders or thoughts so your mind can rest.
              </p>
              <textarea
                rows={3}
                value={offloadText}
                onChange={(e) => setOffloadText(e.target.value)}
                placeholder="e.g. Bring physics manual tomorrow, ask prof about assignment 3, recharge wifi..."
                className="w-full rounded-card bg-white/[0.05] p-3 text-sm text-white placeholder-slate-400 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-desk-amber/30 resize-none font-sans"
              />
              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white">
                  Back
                </button>
                <GlassButton variant="accent" size="md" onClick={() => setStep(3)}>
                  <span>Set Tomorrow's Plan</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </GlassButton>
              </div>
            </div>
          )}

          {/* Step 3: Tomorrow's Top Priorities */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-white">
                Tomorrow's Top Focus Slots
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 rounded-card bg-white/[0.04] p-3 border border-white/[0.08]">
                  <span className="font-mono font-bold text-desk-amber">01</span>
                  <span className="text-white font-medium">DBMS Assignment 3 (Final Submission)</span>
                </div>
                <div className="flex items-center gap-2 rounded-card bg-white/[0.04] p-3 border border-white/[0.08]">
                  <span className="font-mono font-bold text-desk-teal-light">02</span>
                  <span className="text-white font-medium">OS Lab Record #4 (Banker's Algorithm)</span>
                </div>
                <div className="flex items-center gap-2 rounded-card bg-white/[0.04] p-3 border border-white/[0.08]">
                  <span className="font-mono font-bold text-slate-400">03</span>
                  <span className="text-white font-medium">30m Gym & Strength Routine</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(2)} className="text-xs text-slate-400 hover:text-white">
                  Back
                </button>
                <GlassButton variant="teal" size="md" onClick={handleFinish}>
                  <Check className="h-4 w-4 mr-1" />
                  <span>Close Desk & Sleep</span>
                </GlassButton>
              </div>
            </div>
          )}

          {/* Step 4: Peaceful Day Closed Animation */}
          {step === 4 && (
            <div className="py-8 text-center space-y-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-desk-teal/20 text-desk-teal border border-desk-teal/40"
              >
                <Moon className="h-8 w-8 text-desk-amber" />
              </motion.div>
              <h3 className="font-serif text-2xl font-semibold text-white">Study Desk Closed</h3>
              <p className="text-xs text-slate-400 font-mono">
                Quiet hours active until {effectiveQuietEnd}. Sleep well{cleanName ? `, ${cleanName}` : ""}.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
