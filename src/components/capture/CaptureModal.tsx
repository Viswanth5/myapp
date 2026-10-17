"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Check,
  Calendar,
  Clock,
  Tag,
  IndianRupee,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrbitStore } from "@/store/useOrbitStore";
import { ParsedEntry } from "@/lib/parser/types";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import confetti from "canvas-confetti";

export const CaptureModal: React.FC = () => {
  const {
    isDumpOpen,
    setDumpOpen,
    dumpInput,
    setDumpInput,
    parsedPreview,
    setParsedPreview,
    isParsing,
    setIsParsing,
    isRecording,
    setIsRecording,
    triggerRefresh,
  } = useOrbitStore();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice capture initialization
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDumpInput(dumpInput ? `${dumpInput}, ${transcript}` : transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [dumpInput, setDumpInput, setIsRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Parse input whenever modal opens or input changes
  const handleParse = async () => {
    if (!dumpInput.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: dumpInput }),
      });

      if (!res.ok) throw new Error("Parsing failed");
      const data = await res.json();
      setParsedPreview(data.entries || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not parse input. Please check connection.");
    } finally {
      setIsParsing(false);
    }
  };

  // Auto-parse on modal open if input exists
  useEffect(() => {
    if (isDumpOpen && dumpInput && parsedPreview.length === 0) {
      handleParse();
    }
  }, [isDumpOpen]);

  // One-tap Confirm All
  const handleConfirmAll = async () => {
    if (parsedPreview.length === 0) return;
    setIsConfirming(true);

    try {
      const res = await fetch("/api/capture/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: parsedPreview }),
      });

      if (!res.ok) throw new Error("Confirmation failed");

      // Trigger celebratory mini confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#1F6F6B", "#E0A458", "#38BDF8"],
      });

      setDumpInput("");
      setParsedPreview([]);
      setDumpOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save entries. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const updateItemTitle = (idx: number, newTitle: string) => {
    const next = [...parsedPreview];
    next[idx] = { ...next[idx], title: newTitle };
    setParsedPreview(next);
  };

  const updateItemAmount = (idx: number, newAmount: number) => {
    const next = [...parsedPreview];
    next[idx] = { ...next[idx], amount: newAmount, clarificationQuestion: null };
    setParsedPreview(next);
  };

  const removeItem = (idx: number) => {
    setParsedPreview(parsedPreview.filter((_, i) => i !== idx));
  };

  if (!isDumpOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDumpOpen(false)}
          className="absolute inset-0 bg-ink-950/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-[#0B1220]/95 backdrop-blur-2xl border border-white/[0.18] p-6 shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.1]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orbit-amber/20 text-orbit-amber border border-orbit-amber/30">
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-white">Brain Dump Capture</h3>
                <p className="text-xs text-slate-400">Everything organizes itself with zero manual sorting</p>
              </div>
            </div>
            <button
              onClick={() => setDumpOpen(false)}
              className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Text input area */}
          <div className="py-4 space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={dumpInput}
                onChange={(e) => setDumpInput(e.target.value)}
                placeholder="Type anything: 'OS lab record due thursday 2pm, ₹220 swiggy, meditate daily, save 3000 by diwali'..."
                className="w-full rounded-2xl bg-white/[0.05] p-3.5 text-sm text-white placeholder-slate-400 border border-white/[0.12] focus:border-orbit-amber/50 focus:outline-none focus:ring-2 focus:ring-orbit-amber/20 resize-none font-sans"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <GlassButton
                  variant={isRecording ? "accent" : "ghost"}
                  size="sm"
                  onClick={toggleRecording}
                  className="text-xs"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3.5 w-3.5 text-red-950 animate-pulse" strokeWidth={2} />
                      <span className="text-ink-950 font-bold">Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>Voice</span>
                    </>
                  )}
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={handleParse}
                  isLoading={isParsing}
                  disabled={!dumpInput.trim()}
                >
                  <span>Parse</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </GlassButton>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Parsed Cards Preview Section */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {parsedPreview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">
                    Parsed {parsedPreview.length} {parsedPreview.length === 1 ? "entry" : "entries"} (editable inline):
                  </span>
                  <Badge variant="teal" size="sm">Auto-Categorized</Badge>
                </div>

                <div className="space-y-2.5">
                  {parsedPreview.map((item, idx) => {
                    const typeColors = {
                      TASK: "text-orbit-teal-light border-orbit-teal/30 bg-orbit-teal/10",
                      EXAM: "text-rose-300 border-rose-500/40 bg-rose-500/10",
                      EXPENSE: "text-orbit-amber-light border-orbit-amber/30 bg-orbit-amber/10",
                      INCOME: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
                      HABIT: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10",
                      GOAL: "text-orbit-cyan-glow border-orbit-cyan/30 bg-orbit-cyan/10",
                      EVENT: "text-slate-200 border-slate-500/30 bg-slate-500/10",
                    };

                    return (
                      <div
                        key={item.id || idx}
                        className="group relative flex flex-col gap-2 rounded-2xl bg-white/[0.05] p-3 border border-white/[0.12] hover:border-white/[0.22] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider border ${typeColors[item.type]}`}
                            >
                              {item.type}
                            </span>
                            {item.courseCode && (
                              <Badge variant="outline" size="sm">
                                {item.courseCode}
                              </Badge>
                            )}
                            {item.amount && (
                              <span className="text-xs font-mono font-semibold text-orbit-amber">
                                ₹{item.amount}
                              </span>
                            )}
                            {item.targetValue && (
                              <span className="text-xs font-mono font-semibold text-orbit-cyan-glow">
                                ₹{item.targetValue} Target
                              </span>
                            )}
                            {item.frequencyDays && (
                              <span className="text-xs font-mono text-indigo-300">
                                {item.frequencyDays}x / week
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-300 opacity-60 hover:opacity-100 transition-opacity p-1"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title Editable Input */}
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItemTitle(idx, e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-white border-b border-transparent hover:border-white/20 focus:border-orbit-amber/60 focus:outline-none py-0.5 transition-colors"
                        />

                        {/* Ambiguity clarification banner for tasks */}
                        {item.type === "TASK" && item.isAmbiguous && (
                          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-orbit-amber/10 border border-orbit-amber/25 p-2 text-xs">
                            <HelpCircle className="h-3.5 w-3.5 text-orbit-amber shrink-0" />
                            <span className="text-amber-200 text-[11px] font-medium">
                              {item.clarificationQuestion || "When should this task be finished?"}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const today = new Date();
                                  today.setHours(18, 0, 0, 0);
                                  const next = [...parsedPreview];
                                  next[idx] = { ...next[idx], dueAt: today.toISOString(), isAmbiguous: false, clarificationQuestion: null };
                                  setParsedPreview(next);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.18] text-[10px] font-mono text-white transition-colors"
                              >
                                Today 6 PM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(10, 0, 0, 0);
                                  const next = [...parsedPreview];
                                  next[idx] = { ...next[idx], dueAt: tomorrow.toISOString(), isAmbiguous: false, clarificationQuestion: null };
                                  setParsedPreview(next);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.18] text-[10px] font-mono text-white transition-colors"
                              >
                                Tomorrow 10 AM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const friday = new Date();
                                  const day = friday.getDay();
                                  const diff = (5 - day + 7) % 7 || 7;
                                  friday.setDate(friday.getDate() + diff);
                                  friday.setHours(17, 0, 0, 0);
                                  const next = [...parsedPreview];
                                  next[idx] = { ...next[idx], dueAt: friday.toISOString(), isAmbiguous: false, clarificationQuestion: null };
                                  setParsedPreview(next);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.18] text-[10px] font-mono text-white transition-colors"
                              >
                                Friday 5 PM
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Expense amount input / clarification question */}
                        {item.type === "EXPENSE" && (
                          <div className="flex flex-wrap items-center gap-2 pt-1 pb-0.5">
                            <span className="text-xs font-mono text-orbit-amber">₹</span>
                            <input
                              type="number"
                              placeholder="Enter amount"
                              value={item.amount ?? ""}
                              onChange={(e) => updateItemAmount(idx, parseFloat(e.target.value) || 0)}
                              className="w-28 rounded-lg bg-white/[0.08] px-2.5 py-1 text-xs font-mono text-white border border-white/[0.16] focus:border-orbit-amber focus:outline-none"
                            />
                            {item.clarificationQuestion && !item.amount && (
                              <span className="text-[11px] text-orbit-amber italic">
                                {item.clarificationQuestion}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Details meta */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                          {item.priority && (
                            <span
                              onClick={() => {
                                const priorities: Array<"LOW" | "MEDIUM" | "HIGH" | "URGENT"> = ["LOW", "MEDIUM", "HIGH", "URGENT"];
                                const currentIdx = priorities.indexOf(item.priority as any);
                                const nextPriority = priorities[(currentIdx + 1) % priorities.length];
                                const next = [...parsedPreview];
                                next[idx] = { ...next[idx], priority: nextPriority };
                                setParsedPreview(next);
                              }}
                              className={`cursor-pointer rounded-full px-2 py-0.5 text-[10px] border ${
                                item.priority === "URGENT"
                                  ? "text-rose-300 border-rose-500/40 bg-rose-500/15 font-semibold"
                                  : item.priority === "HIGH"
                                  ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
                                  : item.priority === "LOW"
                                  ? "text-slate-400 border-slate-500/30 bg-slate-500/10"
                                  : "text-teal-300 border-teal-500/30 bg-teal-500/10"
                              }`}
                              title="Click to change priority"
                            >
                              Priority: {item.priority}
                            </span>
                          )}

                          {item.dueAt ? (
                            <div className="flex items-center gap-1 text-slate-300">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span>
                                {new Date(item.dueAt).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-400/80 italic">No deadline set</span>
                          )}

                          {item.effortMin && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.effortMin} min</span>
                            </div>
                          )}

                          {item.category && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <span>{item.category}</span>
                            </div>
                          )}

                          <span className="text-[10px] text-slate-500">
                            Confidence {Math.round((item.confidence || 0.9) * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.1] pt-4">
            <button
              onClick={() => {
                setDumpInput("");
                setParsedPreview([]);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <GlassButton variant="ghost" size="sm" onClick={() => setDumpOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="accent"
                size="md"
                onClick={handleConfirmAll}
                isLoading={isConfirming}
                disabled={parsedPreview.length === 0}
              >
                <Check className="h-4 w-4 mr-1" strokeWidth={2} />
                <span>Confirm All ({parsedPreview.length})</span>
              </GlassButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
