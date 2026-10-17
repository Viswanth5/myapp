"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "secondary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-white text-ink-950 font-medium hover:bg-slate-100 shadow-md border border-white/40",
      secondary: "bg-white/[0.08] hover:bg-white/[0.14] text-slate-100 border border-white/[0.16] backdrop-blur-md shadow-glass-sm",
      accent: "bg-orbit-amber hover:bg-orbit-amber-glow text-ink-950 font-medium shadow-amber-glow border border-amber-300/40",
      teal: "bg-orbit-teal hover:bg-orbit-teal-glow text-white font-medium shadow-teal-glow border border-teal-400/40",
      ghost: "bg-transparent hover:bg-white/[0.08] text-slate-300 hover:text-white border border-transparent",
      danger: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 shadow-sm",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-full gap-1.5",
      md: "px-4 py-2 text-sm rounded-full gap-2",
      lg: "px-6 py-3 text-base rounded-full gap-2.5",
      icon: "p-2 rounded-full",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orbit-amber/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1.5" />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";
