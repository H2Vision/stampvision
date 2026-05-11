import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        // ── Brand — H2 Stamping Industrial Green ──────────────
        brand: {
          DEFAULT:    "#16A34A",   // green-600  — primary action
          hover:      "#15803D",   // green-700  — hover
          dark:       "#166534",   // green-800  — pressed / text on light
          "5":        "rgba(22,163,74,0.05)",
          "10":       "rgba(22,163,74,0.10)",
          "15":       "rgba(22,163,74,0.15)",
          "20":       "rgba(22,163,74,0.20)",
          "30":       "rgba(22,163,74,0.30)",
          black:      "#0A0C0E",
        },
        // ── Sidebar — deep slate, feels premium ───────────────
        sidebar: {
          DEFAULT:    "#0B1120",   // very dark navy-black
          hover:      "#111827",   // slightly lighter on hover
          active:     "#162032",   // active item bg
          border:     "#1E2D40",   // dividers
          text:       "#64748B",   // default nav text (slate-500)
          "text-h":   "#CBD5E1",   // hover text (slate-300)
        },
        // ── Surface ───────────────────────────────────────────
        surface: {
          DEFAULT:  "#F0F4F8",     // page background — cool off-white
          card:     "#FFFFFF",
          border:   "#E2E8F0",
          input:    "#EEF2F7",
        },
        // ── Steel blue accents (data / info) ──────────────────
        steel: {
          DEFAULT:  "#0EA5E9",     // sky-500 — data callouts
          light:    "#38BDF8",
          dark:     "#0369A1",
          "10":     "rgba(14,165,233,0.10)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        sidebar: "4px 0 24px rgba(0,0,0,0.35)",
        header:  "0 1px 0 #E2E8F0, 0 2px 8px rgba(0,0,0,0.04)",
        card:    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-h":"0 4px 16px rgba(0,0,0,0.12)",
      },
      transitionDuration: {
        sidebar: "220ms",
      },
      width: {
        sidebar:     "240px",
        "sidebar-sm": "64px",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 220ms ease-out",
        "fade-in":  "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
