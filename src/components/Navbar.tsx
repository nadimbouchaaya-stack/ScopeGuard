"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isPortal = pathname.startsWith("/portal");
  const isLanding = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/deadlines", label: "Deadlines" },
    { href: "/history", label: "History" },
  ];

  const showAppNav = !isPortal && !isAuthPage && !isLanding && user;
  const showLandingNav = isLanding && !user;

  return (
    <nav className={`bg-[#0F172A] ${isLanding ? "border-b border-[#475569]/50" : "border-b border-[#475569]"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#F1F5F9]"
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
          <span className="text-[#F1F5F9] font-bold text-xl tracking-tight">
            ScopeGuard
          </span>
        </Link>

        {/* Landing page nav — Login / Sign Up */}
        {showLandingNav && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Authenticated app nav */}
        {showAppNav && (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "text-[#F1F5F9]"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/projects/new"
                className="text-sm font-medium bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] px-4 py-2 rounded-lg transition-colors"
              >
                New Project
              </Link>
              <div className="h-5 w-px bg-[#475569]" />
              <span className="text-xs text-[#94A3B8] max-w-[140px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-[#94A3B8] hover:text-[#F87171] transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </>
        )}

        {isPortal && (
          <span className="text-sm text-[#94A3B8] font-medium">
            Client Portal
          </span>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {showAppNav && menuOpen && (
        <div className="md:hidden border-t border-[#475569] bg-[#0F172A] px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-[#F1F5F9] bg-[#1E293B]"
                  : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/projects/new"
            onClick={() => setMenuOpen(false)}
            className="block text-center text-sm font-medium bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] px-4 py-2.5 rounded-lg transition-colors mt-2"
          >
            New Project
          </Link>
          <div className="border-t border-[#475569] mt-3 pt-3 px-3 flex items-center justify-between">
            <span className="text-xs text-[#94A3B8] truncate max-w-[200px]">
              {user.email}
            </span>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }}
              className="text-sm font-medium text-[#94A3B8] hover:text-[#F87171] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
