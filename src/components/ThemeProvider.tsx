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
    "--bg-primary": "#0A0A0A",
    "--bg-card": "#111111",
    "--bg-input": "#0A0A0A",
    "--bg-hover": "#1A1A1A",
    "--border": "#2A2A2A",
    "--text-primary": "#FFFFFF",
    "--text-secondary": "#A3A3A3",
    "--accent": "#6366F1",
    "--accent-hover": "#5254CC",
    "--accent-text": "#818CF8",
    "--success": "#34D399",
    "--warning": "#F59E0B",
    "--danger": "#EF4444",
  },
  light: {
    "--bg-primary": "#FAFAFA",
    "--bg-card": "#FFFFFF",
    "--bg-input": "#F5F5F5",
    "--bg-hover": "#EEEEEE",
    "--border": "#E5E5E5",
    "--text-primary": "#0A0A0A",
    "--text-secondary": "#525252",
    "--accent": "#6366F1",
    "--accent-hover": "#5254CC",
    "--accent-text": "#4F46E5",
    "--success": "#059669",
    "--warning": "#D97706",
    "--danger": "#DC2626",
  },
  colorblind: {
    "--bg-primary": "#0A0A0A",
    "--bg-card": "#111111",
    "--bg-input": "#0A0A0A",
    "--bg-hover": "#1A1A1A",
    "--border": "#2A2A2A",
    "--text-primary": "#FFFFFF",
    "--text-secondary": "#A3A3A3",
    "--accent": "#2563EB",
    "--accent-hover": "#1D4ED8",
    "--accent-text": "#60A5FA",
    "--success": "#2563EB",
    "--warning": "#F59E0B",
    "--danger": "#EA580C",
  },
  neon: {
    "--bg-primary": "#000000",
    "--bg-card": "#0A0A0A",
    "--bg-input": "#000000",
    "--bg-hover": "#141414",
    "--border": "#1A1A1A",
    "--text-primary": "#FFFFFF",
    "--text-secondary": "#888888",
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
    const saved = localStorage.getItem("scopeguard_theme") as Theme | null;
    if (saved && themeVars[saved]) {
      applyTheme(saved);
    }
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
    root.setAttribute("data-theme", t);
    localStorage.setItem("scopeguard_theme", t);
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
