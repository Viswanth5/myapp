"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { calculatePaceMultiplier } from "@/lib/engine/pace";
import confetti from "canvas-confetti";

interface FocusRoomModalProps {
  task: { id: string; title: string; effortMin?: number | null } | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (actualMinutes: number) => void;
}

export const FocusRoomModal: React.FC<FocusRoomModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWhiteNoise, setIsWhiteNoise] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [noiseNode, setNoiseNode] = useState<AudioNode | null>(null);

  // Set duration on task change
  useEffect(() => {
    if (task?.effortMin) {
      const sec = Math.min(task.effortMin * 60, 50 * 60);
      setTotalSeconds(sec);
      setRemainingSeconds(sec);
    } else {
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
    }
  }, [task]);

  // Focus Timer interval
  useEffect(() => {
    let timer: any = null;
    if (isRunning && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      handleFinished();
    }
    return () => clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  // Audio White Noise toggle (Web Audio API synthetic brown noise)
  const toggleSound = () => {
    if (isWhiteNoise) {
      if (noiseNode) {
        (noiseNode as any).disconnect();
      }
      setIsWhiteNoise(false);
    } else {
      try {
        const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 0.15; // gentle volume
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        whiteNoise.connect(ctx.destination);
        whiteNoise.start(0);

        setAudioContext(ctx);
        setNoiseNode(whiteNoise);
        setIsWhiteNoise(true);
      } catch (e) {
        console.warn("Web audio unavailable", e);
      }
    }
  };

  const handleFinished = () => {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#1F6F6B", "#E0A458", "#38BDF8"],
    });
    const actualMinutes = Math.round((totalSeconds - remainingSeconds) / 60) || task?.effortMin || 25;
    onComplete(actualMinutes);
  };

  if (!isOpen || !task) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  const pace = calculatePaceMultiplier();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05080E]/95 backdrop-blur-3xl">
        {/* Shifting atmospheric study background */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.45, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-tr from-[#1F6F6B]/30 via-transparent to-[#E0A458]/20 pointer-events-none"
        />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center space-y-6">
          {/* Header */}
          <div className="w-full flex items-center justify-between">
            <Badge variant="teal" size="md">
              Focus Chamber Active
            </Badge>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="flex items-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] px-3 py-1.5 text-xs text-slate-300 transition-colors"
                title="Binaural White Noise"
              >
                {isWhiteNoise ? <Volume2 className="h-4 w-4 text-desk-amber" /> : <VolumeX className="h-4 w-4" />}
                <span className="font-mono text-[11px]">{isWhiteNoise ? "Ambient On" : "Sound Off"}</span>
              </button>

              <button
                onClick={() => {
                  if (noiseNode) (noiseNode as any).disconnect();
                  onClose();
                }}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.1] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Task Info */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono tracking-mono text-desk-amber uppercase">
              Current Focus Objective
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              {task.title}
            </h2>
          </div>

          {/* Circular Timer Ring */}
          <div className="relative flex h-64 w-64 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="5"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="transparent"
                stroke="#1F6F6B"
                strokeWidth="5"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-5xl sm:text-6xl font-bold text-white tabular-nums tracking-tight">
                {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-xs font-mono text-slate-400 mt-1 uppercase">
                {isRunning ? "Deep Focus In Progress" : "Paused"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsRunning(false);
                setRemainingSeconds(totalSeconds);
              }}
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </GlassButton>

            <GlassButton
              variant={isRunning ? "secondary" : "accent"}
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 font-semibold text-base"
            >
              {isRunning ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              <span>{isRunning ? "Pause Session" : "Start Focus"}</span>
            </GlassButton>

            <GlassButton
              variant="teal"
              size="md"
              onClick={handleFinished}
              title="Complete Task"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              <span>Finish Early</span>
            </GlassButton>
          </div>

          {/* Pace Engine Learning Chip */}
          <div className="w-full rounded-card bg-white/[0.04] p-3.5 border border-white/[0.08] text-xs text-left space-y-1">
            <div className="flex items-center gap-1.5 text-desk-amber font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Pace Calibration Engine</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">{pace.insightText}</p>
            <p className="text-[10px] font-mono text-slate-400">{pace.recommendation}</p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
