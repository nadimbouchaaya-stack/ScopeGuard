"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, saveProfile, uploadAvatar } from "@/lib/profile";
import AppTopBar from "@/components/AppTopBar";

const PRESET_AVATARS = [
  "🧑‍💻", "👩‍💼", "👨‍💼", "🧑‍🎨", "👩‍🎨", "🧑‍🔧",
  "🦊", "🐺", "🦁", "🐯", "🦅", "🐙",
  "💎", "🔮", "🛡️", "⚡", "🌊", "🎯",
];

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");

      try {
        const profile = await getProfile();
        setFullName(profile.full_name);
        setAvatarUrl(profile.avatar_url);
        setPaymentLink(profile.payment_link);
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  async function handleSave(field: string, updates: Parameters<typeof saveProfile>[0]) {
    setSaving(field);
    setSaved(null);
    setSuccessToast(false);
    try {
      await saveProfile(updates);
      setSaved(field);
      setSuccessToast(true);
      setTimeout(() => { setSaved(null); setSuccessToast(false); }, 3000);
    } catch {}
    setSaving(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      await saveProfile({ avatar_url: url });
      setSaved("avatar");
      setTimeout(() => setSaved(null), 2000);
    } catch {}
    setUploading(false);
  }

  async function handlePresetAvatar(preset: string) {
    setAvatarUrl(preset);
    await handleSave("avatar", { avatar_url: preset });
  }

  if (!loaded) return null;

  const cardStyle = { backgroundColor: "var(--bg-card, #0F1322)", borderColor: "var(--border-color, rgba(255,255,255,0.06))" };
  const cardClass = "rounded-[14px] p-6 border";
  const inputClass =
    "w-full bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white rounded-[10px] px-4 py-3 focus:outline-none focus:ring-1 transition-colors border";
  const labelClass = "block text-sm font-medium mb-2";

  // Check if avatar is a preset emoji (single character / emoji) or a URL
  const isEmojiAvatar = avatarUrl && !avatarUrl.startsWith("http");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page, #07090F)" }}>
      <AppTopBar title="Profile" />
      <div className="p-5">

      {successToast && (
        <div className="mb-6 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Profile updated successfully
        </div>
      )}

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className={cardClass} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#F1F5F9" }}>
            Avatar
          </h2>

          <div className="flex items-center gap-5 mb-5">
            {/* Current avatar display */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {isEmojiAvatar ? (
                <span className="text-4xl">{avatarUrl}</span>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg
                  className="w-10 h-10"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors border disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#F1F5F9",
                }}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              {saved === "avatar" && (
                <span className="ml-2 text-xs font-medium" style={{ color: "#34D399" }}>
                  Saved!
                </span>
              )}
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Or pick a preset below
              </p>
            </div>
          </div>

          {/* Preset avatars grid */}
          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetAvatar(preset)}
                className={`text-2xl p-2 rounded-lg transition-all border ${
                  avatarUrl === preset ? "ring-2 scale-110" : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: avatarUrl === preset
                    ? "#6366F126"
                    : "rgba(255,255,255,0.04)",
                  borderColor: avatarUrl === preset
                    ? "#6366F1"
                    : "transparent",
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className={cardClass} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "#F1F5F9" }}>
            Personal Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass} style={{ color: "rgba(255,255,255,0.35)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={inputClass}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#F1F5F9",
                }}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: "rgba(255,255,255,0.35)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputClass} cursor-not-allowed opacity-60`}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Email is managed through your authentication provider
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave("name", { full_name: fullName })}
                disabled={saving === "name"}
                className="text-sm font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: saved === "name" ? "#34D399" : "#6366F1",
                  color: saved === "name" ? "#0F172A" : "#F1F5F9",
                }}
              >
                {saving === "name" ? "Saving..." : saved === "name" ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Link */}
        <div className={cardClass} style={cardStyle}>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "#F1F5F9" }}>
            Default Payment Link
          </h2>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            Set a default payment link to quickly add to new projects
          </p>

          <div className="flex gap-3">
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="e.g. https://paypal.me/yourname"
              className={inputClass}
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.08)",
                color: "#F1F5F9",
              }}
            />
            <button
              onClick={() => handleSave("payment", { payment_link: paymentLink })}
              disabled={saving === "payment"}
              className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: saved === "payment" ? "#34D399" : "#6366F1",
                color: saved === "payment" ? "#0F172A" : "#F1F5F9",
              }}
            >
              {saving === "payment" ? "..." : saved === "payment" ? "Saved!" : "Save"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {["PayPal", "Stripe", "Wise", "Revolut"].map((provider) => (
              <span
                key={provider}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
