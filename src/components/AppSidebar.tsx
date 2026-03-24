"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const [userInitial, setUserInitial] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // Get user initial
      const metaName = user.user_metadata?.full_name;
      if (metaName?.trim()) {
        setUserInitial(metaName.trim()[0].toUpperCase());
      } else {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          if (profile?.full_name?.trim()) {
            setUserInitial(profile.full_name.trim()[0].toUpperCase());
          } else {
            setUserInitial((user.email?.[0] ?? "U").toUpperCase());
          }
        } catch {
          setUserInitial((user.email?.[0] ?? "U").toUpperCase());
        }
      }

      // Fetch pending CR count
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id);
      const pIds = projects?.map((p: { id: string }) => p.id) ?? [];
      if (pIds.length > 0) {
        const { data: crs } = await supabase
          .from("change_requests")
          .select("id, status")
          .in("project_id", pIds);
        const count = crs?.filter(
          (cr: { id: string; status: string }) => cr.status?.toLowerCase().trim() === "pending"
        ).length ?? 0;
        setPendingCount(count);
      }
    });
  }, []);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: "/projects",
      label: "Projects",
      showPip: pendingCount > 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
    },
    {
      href: "/deadlines",
      label: "Deadlines",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      href: "/history",
      label: "History",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[52px] border-r z-50 flex-col items-center py-4 gap-1" style={{ backgroundColor: "var(--bg-sidebar, #0B0E18)", borderColor: "var(--border-color, rgba(255,255,255,0.05))" }}>
        {/* Logo */}
        <Link
          href="/dashboard"
          className="w-[36px] h-[36px] bg-[#6366F1] rounded-[10px] flex items-center justify-center mb-4 hover:opacity-90 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </Link>

        {/* Nav items */}
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative w-[36px] h-[36px] rounded-[10px] flex items-center justify-center transition-colors ${
              isActive(item.href)
                ? "bg-[rgba(99,102,241,0.18)]"
                : "hover:bg-[rgba(255,255,255,0.05)]"
            }`}
            title={item.label}
          >
            <span
              className={`${
                isActive(item.href) ? "text-[#818CF8] opacity-100" : "text-white opacity-40"
              }`}
            >
              {item.icon}
            </span>
            {item.showPip && (
              <span className="absolute top-[7px] right-[7px] w-[5px] h-[5px] bg-[#EF4444] rounded-full border-[1.5px] border-[#0B0E18]" />
            )}
          </Link>
        ))}

        {/* Bottom section */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <Link
            href="/settings"
            className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center transition-colors ${
              isActive("/settings")
                ? "bg-[rgba(99,102,241,0.18)]"
                : "hover:bg-[rgba(255,255,255,0.05)]"
            }`}
            title="Settings"
          >
            <span className={`${isActive("/settings") ? "text-[#818CF8] opacity-100" : "text-white opacity-40"}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
          </Link>

          <Link
            href="/profile"
            className="w-[28px] h-[28px] rounded-full bg-[#6366F1] border-2 border-[rgba(99,102,241,0.4)] flex items-center justify-center mt-1"
            title="Profile"
          >
            <span className="text-[11px] font-medium text-white leading-none">{userInitial || "U"}</span>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[56px] border-t z-50 flex items-center justify-around px-2" style={{ backgroundColor: "var(--bg-sidebar, #0B0E18)", borderColor: "var(--border-color, rgba(255,255,255,0.05))" }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center w-[48px] h-[44px] rounded-[10px] transition-colors ${
              isActive(item.href)
                ? "bg-[rgba(99,102,241,0.18)]"
                : ""
            }`}
          >
            <span className={`${isActive(item.href) ? "text-[#818CF8] opacity-100" : "text-white opacity-40"}`}>
              {item.icon}
            </span>
            <span className={`text-[9px] mt-0.5 ${isActive(item.href) ? "text-[#818CF8]" : "text-[rgba(255,255,255,0.3)]"}`}>
              {item.label}
            </span>
            {item.showPip && (
              <span className="absolute top-[4px] right-[8px] w-[5px] h-[5px] bg-[#EF4444] rounded-full" />
            )}
          </Link>
        ))}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center w-[48px] h-[44px] rounded-[10px] transition-colors ${
            isActive("/settings") ? "bg-[rgba(99,102,241,0.18)]" : ""
          }`}
        >
          <span className={`${isActive("/settings") ? "text-[#818CF8] opacity-100" : "text-white opacity-40"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span className={`text-[9px] mt-0.5 ${isActive("/settings") ? "text-[#818CF8]" : "text-[rgba(255,255,255,0.3)]"}`}>
            Settings
          </span>
        </Link>
      </nav>
    </>
  );
}
