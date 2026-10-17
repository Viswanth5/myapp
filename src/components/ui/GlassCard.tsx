"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  level?: 1 | 2 | 3;
  variant?: "default" | "hero" | "subtle" | "interactive" | "amber" | "teal";
  className?: string;
  children?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  level = 1,
  variant,
  className,
  children,
  ...props
}) => {
  // Determine styles based on Level or Variant
  let levelClass = "glass-lvl-1";
  if (level === 2 || variant === "interactive") {
    levelClass = "glass-lvl-2";
  } else if (level === 3 || variant === "hero") {
    levelClass = "glass-lvl-3";
  }

  const variantAccent = {
    amber: "border-desk-amber/35 bg-gradient-to-br from-desk-amber/10 to-white/[0.04]",
    teal: "border-desk-teal/35 bg-gradient-to-br from-desk-teal/15 to-white/[0.04]",
  }[variant as "amber" | "teal"] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative rounded-panel p-5 overflow-hidden",
        levelClass,
        variantAccent,
        className
      )}
      {...props}
    >
      {/* Specular Top Reflection Inset */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </motion.div>
  );
};
