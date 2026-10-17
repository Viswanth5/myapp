"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import { useOrbitStore } from "@/store/useOrbitStore";
import { ParsedEntry } from "@/lib/parser/types";
import { FileText, Sparkles, X, Check, ArrowRight, MessageSquareQuote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_NOTICES = [
  {
    title: "WhatsApp Class Group Notice",
    text: "Guys, the professor posted: DBMS Assignment 3 submission deadline is this Friday 5pm. Also Midsem Exam is scheduled for Oct 14th 10am in Hall 204.",
  },
  {
    title: "Hostel / Mess Payment Circular",
    text: "Notice: Monthly Mess bill of ₹3,450 is due by 10th October. Electricity surcharge of ₹450 to be paid at Warden office.",
  },
  {
    title: "Club Hackathon & Lab Schedule",
    text: "Robotics Club meet at 6pm tomorrow. Submit OS Lab Record 4 on Thursday before 2pm.",
  },
];

export const SmartImportModal: React.FC = () => {
  const { isImportOpen, setImportOpen, triggerRefresh } = useOrbitStore();
  const [rawText, setRawText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedEntries, setExtractedEntries] = useState<ParsedEntry[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  if (!isImportOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: rawText }),
      });
      const data = await res.json();
      setExtractedEntries(data.entries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAll = async () => {
    try {
      const res = await fetch("/api/capture/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: extractedEntries }),
      });
      if (res.ok) {
        setConfirmed(true);
        triggerRefresh();
        setTimeout(() => {
          setConfirmed(false);
          setExtractedEntries([]);
          setRawText("");
          setImportOpen(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl"
        >
          <GlassCard level={3} className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <MessageSquareQuote className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium text-white">
                    Smart Notice & WhatsApp Importer
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    Paste raw circulars, syllabus notices, or WhatsApp messages
                  </p>
                </div>
              </div>

              <button
                onClick={() => setImportOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Try a sample notice:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_NOTICES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setRawText(sample.text);
                      setExtractedEntries([]);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-all text-left"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Textarea */}
            <div className="space-y-2">
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (extractedEntries.length > 0) setExtractedEntries([]);
                }}
                rows={4}
                placeholder="Paste class notice, syllabus breakdown, or payment reminder here..."
                className="w-full rounded-2xl bg-white/[0.04] p-3.5 text-xs text-white placeholder-slate-500 border border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-sans resize-none"
              />

              <div className="flex justify-end">
                <GlassButton
                  variant="accent"
                  size="sm"
                  onClick={handleParse}
                  disabled={!rawText.trim() || isProcessing}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-teal-300" />
                  {isProcessing ? "Extracting Entries..." : "Auto-Extract Entries"}
                </GlassButton>
              </div>
            </div>

            {/* Extracted Preview Table */}
            {extractedEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-3 border-t border-white/[0.08]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300">
                    Extracted {extractedEntries.length} items from notice
                  </span>
                  <Badge variant="teal" size="sm">
                    Ready to Save
                  </Badge>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {extractedEntries.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase text-teal-400 font-semibold">
                            {item.type}
                          </span>
                          {(item as any).courseCode || (item as any).course ? (
                            <span className="text-[10px] font-mono text-slate-400">
                              • {(item as any).courseCode || (item as any).course}
                            </span>
                          ) : null}
                        </div>
                        <p className="font-medium text-slate-100">{item.title}</p>
                      </div>

                      <div className="text-right font-mono text-[11px] text-slate-400">
                        {(item.dueAt || (item as any).due) && <div>{item.dueAt || (item as any).due}</div>}
                        {item.amount && <div className="text-amber-300">₹{item.amount}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setExtractedEntries([])}
                  >
                    Clear
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmAll}
                    disabled={confirmed}
                  >
                    {confirmed ? (
                      <span className="flex items-center gap-1 text-teal-300">
                        <Check className="h-4 w-4" /> Added to VIRA!
                      </span>
                    ) : (
                      "Confirm All to Desk"
                    )}
                  </GlassButton>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
