"use client";

import React from "react";
import { motion } from "framer-motion";

export const AmbientBlobs: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Midnight Canvas */}
      <div className="absolute inset-0 bg-[#070B14] dark:bg-[#070B14]" />

      {/* Blob 1: Muted Teal - Top Left */}
      <motion.div
        animate={{
          x: [0, 35, -25, 0],
          y: [0, -25, 30, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[10%] -left-[10%] w-[680px] h-[680px] rounded-full bg-[#1F6F6B]/20 blur-[150px] transform-gpu will-change-transform"
      />

      {/* Blob 2: Warm Amber - Bottom Right */}
      <motion.div
        animate={{
          x: [0, -45, 35, 0],
          y: [0, 35, -35, 0],
          scale: [1, 0.94, 1.06, 1],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-[15%] -right-[8%] w-[720px] h-[720px] rounded-full bg-[#E0A458]/14 blur-[160px] transform-gpu will-change-transform"
      />

      {/* Blob 3: Dusty Plum - Center Left */}
      <motion.div
        animate={{
          x: [0, 25, -30, 0],
          y: [0, 40, -15, 0],
          scale: [1, 1.04, 0.95, 1],
        }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[30%] left-[25%] w-[550px] h-[550px] rounded-full bg-[#3B2D54]/22 blur-[140px] transform-gpu will-change-transform"
      />
    </div>
  );
};
