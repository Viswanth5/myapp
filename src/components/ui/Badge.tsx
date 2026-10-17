import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "teal" | "amber" | "rose" | "cyan" | "outline" | "critical";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  className,
  children,
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: "bg-white/[0.08] text-slate-300 border border-white/[0.12]",
    teal: "bg-orbit-teal/20 text-orbit-teal-light border border-orbit-teal/40",
    amber: "bg-orbit-amber/20 text-orbit-amber-light border border-orbit-amber/40",
    rose: "bg-orbit-rose/20 text-orbit-rose-light border border-orbit-rose/40",
    cyan: "bg-orbit-cyan/20 text-orbit-cyan-glow border border-orbit-cyan/40",
    outline: "bg-transparent text-slate-300 border border-white/[0.2]",
    critical: "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-mono",
    md: "px-2.5 py-1 text-xs font-mono",
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        onClick ? "cursor-pointer" : "",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
