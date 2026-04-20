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
        // ── Brand ─────────────────────────────────────────────
        brand: {
          yellow:     "#C8FF00",                  // H2 Stamping lime
          "yellow-h": "#D8FF33",                  // hover
          "yellow-d": "#A8D400",                  // pressed / text on light bg
          "yellow-5": "rgba(200,255,0,0.05)",
          "yellow-10":"rgba(200,255,0,0.10)",
          "yellow-15":"rgba(200,255,0,0.15)",
          black:      "#0A0C0E",
        },
        // ── Sidebar ───────────────────────────────────────────
        sidebar: {
          DEFAULT:    "#0D0F14",   // main bg
          hover:      "#14161D",   // nav item hover
          active:     "#181A22",   // nav item active bg
          border:     "#1E2130",   // dividers
          text:       "#6B7280",   // default nav text
          "text-h":   "#D1D5DB",   // hover text
        },
        // ── Surface ───────────────────────────────────────────
        surface: {
          DEFAULT:  "#F1F3F7",     // page background
          card:     "#FFFFFF",
          border:   "#E2E8F0",
          input:    "#EDF0F5",
        },
        // ── Steel blue accents (data / info) ──────────────────
        steel: {
          DEFAULT:  "#3B82F6",
          light:    "#60A5FA",
          dark:     "#1D4ED8",
          "10":     "rgba(59,130,246,0.10)",
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
