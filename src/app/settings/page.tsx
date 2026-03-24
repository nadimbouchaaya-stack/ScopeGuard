"use client";

import { useState, useEffect } from "react";
import { getProfile, saveProfile } from "@/lib/profile";
import { useTheme } from "@/components/ThemeProvider";
import AppTopBar from "@/components/AppTopBar";

const EMOJI_OPTIONS = [
  "💵", "💰", "💎", "🤑", "💸", "🪙",
  "🎉", "🎊", "🥳", "🔥", "⭐", "✨",
  "🚀", "💜", "❤️", "💚", "🌟", "🏆",
  "👏", "🙌", "💪", "🎯", "🍾", "🎁",
];

const THEMES = [
  {
    id: "dark" as const,
    label: "Dark",
    description: "Default dark theme",
    preview: { bg: "#0F172A", card: "#1E293B", accent: "#6366F1" },
  },
  {
    id: "light" as const,
    label: "Light",
    description: "Clean light theme",
    preview: { bg: "#F8FAFC", card: "#FFFFFF", accent: "#6366F1" },
  },
  {
    id: "colorblind" as const,
    label: "Colorblind",
    description: "Optimized for color vision deficiency",
    preview: { bg: "#0F172A", card: "#1E293B", accent: "#2563EB" },
  },
  {
    id: "neon" as const,
    label: "Neon",
    description: "Vibrant cyberpunk aesthetic",
    preview: { bg: "#0A0A0F", card: "#12121A", accent: "#A855F7" },
  },
];

const LANGUAGES = [
  { id: "en" as const, label: "English", flag: "🇬🇧" },
  { id: "fr" as const, label: "Français", flag: "🇫🇷" },
  { id: "es" as const, label: "Español", flag: "🇪🇸" },
  { id: "ar" as const, label: "العربية", flag: "🇸🇦" },
  { id: "it" as const, label: "Italiano", flag: "🇮🇹" },
  { id: "de" as const, label: "Deutsch", flag: "🇩🇪" },
];

export default function SettingsPage() {
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();
  const [emoji, setEmoji] = useState("💵");
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [language, setLanguage] = useState<"en" | "fr" | "es" | "ar" | "it" | "de">("en");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | false>(false);

  useEffect(() => {
    getProfile().then((p) => {
      setEmoji(p.cash_rain_emoji);
      setSelectedTheme(p.theme);
      setLanguage(p.language);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  async function handleSave(field: string, updates: Parameters<typeof saveProfile>[0]) {
    setSaving(field);
    setSaved(null);
    setSuccessToast(false);
    try {
      await saveProfile(updates);
      setSaved(field);
      const msg = field === "emoji"
        ? "Celebration emoji saved"
        : field === "theme"
          ? "Theme updated"
          : "Language preference saved. Translations coming soon!";
      setSuccessToast(msg);
      setTimeout(() => { setSaved(null); setSuccessToast(false); }, 2000);
    } catch {
      // error handled silently
    }
    setSaving(null);
  }

  if (!loaded) return null;

  const cardStyle = { backgroundColor: "var(--bg-card, #0F1322)", borderColor: "var(--border-color, rgba(255,255,255,0.06))" };
  const cardClass = "rounded-[14px] p-6 border";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page, #07090F)" }}>
      <AppTopBar title="Settings" />
      <div className="p-5">

      {successToast && (
        <div className="mb-6 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successToast}
        </div>
      )}

      <div className="space-y-6">
        {/* Cash Rain Emoji Picker */}
        <div className={cardClass} style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "#F1F5F9" }}>
                Cash Rain Emoji
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Choose the emoji that rains when you approve a change request
              </p>
            </div>
            <div className="text-4xl">{emoji}</div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mb-4">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  emoji === e
                    ? "ring-2 scale-110"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: emoji === e ? "#6366F126" : "rgba(255,255,255,0.04)",
                  borderColor: emoji === e ? "#6366F1" : "transparent",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSave("emoji", { cash_rain_emoji: emoji })}
            disabled={saving === "emoji"}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: saved === "emoji" ? "#34D399" : "#6366F1",
              color: saved === "emoji" ? "#0F172A" : "#F1F5F9",
            }}
          >
            {saving === "emoji" ? "Saving..." : saved === "emoji" ? "Saved!" : "Save Emoji"}
          </button>
        </div>

        {/* Theme Switcher */}
        <div className={cardClass} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "#F1F5F9" }}>
            Theme
          </h2>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Choose your preferred visual style
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTheme(t.id);
                  applyTheme(t.id);
                }}
                className={`relative rounded-xl p-4 text-left transition-all border ${
                  selectedTheme === t.id
                    ? "ring-2"
                    : "hover:brightness-110"
                }`}
                style={{
                  backgroundColor: t.preview.card,
                  borderColor: selectedTheme === t.id ? t.preview.accent : "rgba(255,255,255,0.06)",
                }}
              >
                {/* Theme preview bar */}
                <div className="flex gap-1.5 mb-3">
                  <div className="w-8 h-2 rounded-full" style={{ backgroundColor: t.preview.accent }} />
                  <div className="w-5 h-2 rounded-full" style={{ backgroundColor: t.preview.bg, border: "1px solid #475569" }} />
                  <div className="w-6 h-2 rounded-full" style={{ backgroundColor: t.preview.accent + "40" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: t.id === "light" ? "#0F172A" : "#F1F5F9" }}>
                  {t.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: t.id === "light" ? "#475569" : "#94A3B8" }}>
                  {t.description}
                </p>
                {selectedTheme === t.id && (
                  <div
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: t.preview.accent }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSave("theme", { theme: selectedTheme })}
            disabled={saving === "theme"}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: saved === "theme" ? "#34D399" : "#6366F1",
              color: saved === "theme" ? "#0F172A" : "#F1F5F9",
            }}
          >
            {saving === "theme" ? "Saving..." : saved === "theme" ? "Saved!" : "Save Theme"}
          </button>
        </div>

        {/* Language Selector */}
        <div className={cardClass} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "#F1F5F9" }}>
            Language
          </h2>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Select your preferred language (translations coming soon)
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg transition-all border text-left ${
                  language === lang.id ? "ring-1" : ""
                }`}
                style={{
                  backgroundColor: language === lang.id
                    ? "#6366F11A"
                    : "rgba(255,255,255,0.04)",
                  borderColor: language === lang.id
                    ? "#6366F1"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-xl">{lang.flag}</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: language === lang.id
                      ? "#F1F5F9"
                      : "rgba(255,255,255,0.35)",
                  }}
                >
                  {lang.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSave("language", { language })}
            disabled={saving === "language"}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: saved === "language" ? "#34D399" : "#6366F1",
              color: saved === "language" ? "#0F172A" : "#F1F5F9",
            }}
          >
            {saving === "language" ? "Saving..." : saved === "language" ? "Saved!" : "Save Language"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
