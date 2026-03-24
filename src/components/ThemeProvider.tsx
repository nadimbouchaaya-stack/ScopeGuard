"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getProfile } from "@/lib/profile";

type Theme = "dark" | "light" | "colorblind" | "neon";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const themeVars: Record<Theme, Record<string, string>> = {
  dark: {
    "--bg-primary": "#0F172A",
    "--bg-card": "#1E293B",
    "--bg-input": "#0F172A",
    "--bg-hover": "#334155",
    "--border": "#475569",
    "--text-primary": "#F1F5F9",
    "--text-secondary": "#94A3B8",
    "--accent": "#6366F1",
    "--accent-hover": "#5558E6",
    "--accent-text": "#818CF8",
    "--success": "#34D399",
    "--warning": "#FBBF24",
    "--danger": "#F87171",
  },
  light: {
    "--bg-primary": "#F8FAFC",
    "--bg-card": "#FFFFFF",
    "--bg-input": "#F1F5F9",
    "--bg-hover": "#E2E8F0",
    "--border": "#CBD5E1",
    "--text-primary": "#0F172A",
    "--text-secondary": "#475569",
    "--accent": "#6366F1",
    "--accent-hover": "#5558E6",
    "--accent-text": "#4F46E5",
    "--success": "#059669",
    "--warning": "#D97706",
    "--danger": "#DC2626",
  },
  colorblind: {
    "--bg-primary": "#0F172A",
    "--bg-card": "#1E293B",
    "--bg-input": "#0F172A",
    "--bg-hover": "#334155",
    "--border": "#475569",
    "--text-primary": "#F1F5F9",
    "--text-secondary": "#94A3B8",
    "--accent": "#2563EB",
    "--accent-hover": "#1D4ED8",
    "--accent-text": "#60A5FA",
    "--success": "#2563EB",
    "--warning": "#F59E0B",
    "--danger": "#EA580C",
  },
  neon: {
    "--bg-primary": "#0A0A0F",
    "--bg-card": "#12121A",
    "--bg-input": "#0A0A0F",
    "--bg-hover": "#1A1A2E",
    "--border": "#2D2D44",
    "--text-primary": "#EEEEFF",
    "--text-secondary": "#8888AA",
    "--accent": "#A855F7",
    "--accent-hover": "#9333EA",
    "--accent-text": "#C084FC",
    "--success": "#22D3EE",
    "--warning": "#FACC15",
    "--danger": "#F43F5E",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Load theme immediately from localStorage for instant apply
    const saved = localStorage.getItem("scopeguard_theme") as Theme | null;
    if (saved && themeVars[saved]) {
      applyTheme(saved);
    }
    // Also load from profile (which may override localStorage)
    getProfile()
      .then((p) => {
        if (p.theme) applyTheme(p.theme);
      })
      .catch(() => {});
  }, []);

  function applyTheme(t: Theme) {
    setThemeState(t);
    const vars = themeVars[t];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    // Set data-theme attribute for CSS selectors
    root.setAttribute("data-theme", t);
    // Persist to localStorage
    localStorage.setItem("scopeguard_theme", t);
    // Update body classes for Tailwind overrides
    document.body.style.backgroundColor = vars["--bg-primary"];
    document.body.style.color = vars["--text-primary"];
  }

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
