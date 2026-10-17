import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: {
          950: "#05080E",
          900: "#070B14",
          850: "#0B101D",
          800: "#101728",
          700: "#1A233A",
          600: "#273452",
        },
        desk: {
          teal: {
            DEFAULT: "#1F6F6B",
            glow: "#2EA8A3",
            subtle: "#103B39",
            light: "#A7E3E0",
          },
          amber: {
            DEFAULT: "#E0A458",
            glow: "#F5BA73",
            subtle: "#453014",
            light: "#FCE7CA",
          },
          plum: {
            DEFAULT: "#5A3A54",
            glow: "#8E5A84",
            subtle: "#301D2D",
            light: "#E7CEE2",
          },
          cyan: {
            DEFAULT: "#38BDF8",
            glow: "#7DD3FC",
            subtle: "#0C4A6E",
            light: "#BAE6FD",
          },
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Geist", "Inter Tight", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        "panel": "28px",
        "card": "18px",
        "item": "14px",
        "pill": "999px",
      },
      boxShadow: {
        "glass-1": "0 4px 20px 0 rgba(0, 0, 0, 0.25)",
        "glass-2": "0 10px 30px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.22)",
        "glass-3": "0 24px 48px -12px rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.30)",
        "amber-subtle": "0 0 20px -4px rgba(224, 164, 88, 0.25)",
        "teal-subtle": "0 0 20px -4px rgba(31, 111, 107, 0.30)",
      },
      backdropBlur: {
        "lvl-1": "14px",
        "lvl-2": "24px",
        "lvl-3": "40px",
      },
      letterSpacing: {
        tighter: "-0.035em",
        tight: "-0.02em",
        mono: "0.08em",
      },
      animation: {
        "drift-slow": "drift 28s infinite alternate ease-in-out",
        "drift-reverse": "drift 34s infinite alternate-reverse ease-in-out",
      },
      keyframes: {
        drift: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.06)" },
          "100%": { transform: "translate(-30px, 35px) scale(0.96)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
