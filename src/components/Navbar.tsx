"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isPortal = pathname.startsWith("/portal");
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/deadlines", label: "Deadlines" },
    { href: "/history", label: "History" },
  ];

  return (
    <nav className="bg-[#0F172A] border-b border-[#475569]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
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

        {!isPortal && (
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
      {!isPortal && menuOpen && (
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
        </div>
      )}
    </nav>
  );
}
