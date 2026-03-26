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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, [pathname]);

  useEffect(() => {
    if (!isLanding) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLanding]);

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
    <nav className={`${isLanding ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 shadow-lg" : "bg-transparent border-b border-transparent"}` : "bg-[#0A0A0A] border-b border-[#2A2A2A]"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          <span className="text-white font-bold text-xl tracking-tight">
            ScopeGuard
          </span>
        </Link>

        {/* Landing page nav — Login / Sign Up */}
        {showLandingNav && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#A3A3A3] hover:text-white transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[#6366F1] hover:bg-[#5254CC] text-white px-4 py-2 rounded-lg transition-colors"
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
                      ? "text-white"
                      : "text-[#A3A3A3] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/projects/new"
                className="text-sm font-medium bg-[#6366F1] hover:bg-[#5254CC] text-white px-4 py-2 rounded-lg transition-colors"
              >
                New Project
              </Link>
              <div className="h-5 w-px bg-[#475569]" />
              <Link
                href="/profile"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/profile"
                    ? "text-white"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className={`text-sm font-medium transition-colors ${
                  pathname === "/settings"
                    ? "text-white"
                    : "text-[#A3A3A3] hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-[#A3A3A3] hover:text-[#F87171] transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-[#A3A3A3] hover:text-white transition-colors"
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
          <span className="text-sm text-[#A3A3A3] font-medium">
            Client Portal
          </span>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {showAppNav && menuOpen && (
        <div className="md:hidden border-t border-[#2A2A2A] bg-[#0A0A0A] px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-white bg-[#1A1A1A]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/projects/new"
            onClick={() => setMenuOpen(false)}
            className="block text-center text-sm font-medium bg-[#6366F1] hover:bg-[#5254CC] text-white px-4 py-2.5 rounded-lg transition-colors mt-2"
          >
            New Project
          </Link>
          <div className="border-t border-[#2A2A2A] mt-3 pt-3 space-y-1">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/profile"
                  ? "text-white bg-[#1A1A1A]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "text-white bg-[#1A1A1A]"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              Settings
            </Link>
            <div className="px-3 pt-2 flex items-center justify-between">
              <span className="text-xs text-[#A3A3A3] truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }}
                className="text-sm font-medium text-[#A3A3A3] hover:text-[#F87171] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
