"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const inputClass =
    "w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#6366F1] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-[#F1F5F9]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Welcome back</h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Sign in to your ScopeGuard account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 space-y-4">
            {error && (
              <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3">
                <p className="text-[#F87171] text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-50 disabled:cursor-not-allowed text-[#F1F5F9] font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-[#94A3B8] mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#818CF8] hover:text-[#A5B4FC] font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
