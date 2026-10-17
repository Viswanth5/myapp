"use client";

import React, { useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  microLabel?: string;
  icon?: LucideIcon;
  error?: string;
  isPassword?: boolean;
  rightAction?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      microLabel,
      icon: Icon,
      error,
      isPassword,
      rightAction,
      className,
      type = "text",
      id,
      disabled,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full text-left group">
        <div
          className={cn(
            "relative rounded-2xl bg-[#080D1A] border transition-all duration-200 px-4 pt-2.5 pb-2.5 shadow-inner overflow-hidden",
            isFocused
              ? "border-desk-amber/70 ring-2 ring-desk-amber/20 shadow-[0_0_24px_-3px_rgba(224,164,88,0.25)] bg-[#0A1020]"
              : "border-white/[0.1] hover:border-white/[0.2] hover:bg-[#090F1E]",
            error &&
              "border-rose-500/70 ring-2 ring-rose-500/20 shadow-[0_0_18px_-3px_rgba(244,63,94,0.25)]",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {/* Subtle Top Specular Sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

          {/* Integrated Header Row Inside the Card */}
          <div className="flex items-center justify-between gap-2 mb-1 select-none">
            <div className="flex items-center gap-2 min-w-0">
              {Icon && (
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md transition-colors duration-200 shrink-0",
                    isFocused
                      ? "text-desk-amber bg-desk-amber/15 shadow-[0_0_8px_rgba(224,164,88,0.3)]"
                      : "text-slate-400 bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
              )}
              <span className="text-[11px] font-sans font-semibold text-slate-200 tracking-tight truncate">
                {label}
              </span>
              {microLabel && (
                <span className="hidden sm:inline text-[9px] font-mono tracking-widest text-slate-400 uppercase opacity-75">
                  • {microLabel}
                </span>
              )}
            </div>

            {rightAction && (
              <div className="shrink-0 flex items-center">
                {rightAction}
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="relative flex items-center">
            <input
              ref={ref}
              id={inputId}
              type={effectiveType}
              disabled={disabled}
              placeholder={placeholder}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              style={{
                backgroundColor: "transparent",
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
                caretColor: "#e0a458",
              }}
              className={cn(
                "w-full bg-transparent py-1 text-sm sm:text-[15px] font-sans font-medium text-white placeholder:text-slate-500/70 placeholder:italic placeholder:font-light focus:outline-none transition-colors",
                isPassword ? "pr-10" : "pr-1",
                className
              )}
              {...props}
            />

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 p-1.5 rounded-xl text-slate-400 hover:text-desk-amber hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-sans text-rose-300 pl-2 pt-1 leading-tight animate-fadeIn flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-rose-400" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
