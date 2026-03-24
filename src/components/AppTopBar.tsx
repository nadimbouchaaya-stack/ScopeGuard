"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AppTopBarProps {
  title: string;
  subtitle?: string;
}

export default function AppTopBar({ title, subtitle }: AppTopBarProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id);
      const pIds = projects?.map((p: { id: string }) => p.id) ?? [];
      if (pIds.length === 0) return;
      const { data: crs } = await supabase
        .from("change_requests")
        .select("id, status")
        .in("project_id", pIds);
      const count = crs?.filter(
        (cr: { id: string; status: string }) => cr.status?.toLowerCase().trim() === "pending"
      ).length ?? 0;
      setPendingCount(count);
    });
  }, []);

  return (
    <div className="h-[52px] border-b flex items-center px-5 gap-4" style={{ backgroundColor: "var(--bg-topbar, #0B0E18)", borderColor: "var(--border-accent, rgba(99,102,241,0.12))" }}>
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium" style={{ color: "var(--text-primary, white)" }}>{title}</span>
        {subtitle && (
          <span className="text-[12px] text-[rgba(255,255,255,0.35)] ml-2">{subtitle}</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {pendingCount > 0 && (
          <Link
            href="/pending-approvals"
            className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.3)] text-[#FCA5A5] text-[10px] px-2 py-1 rounded-full hover:bg-[rgba(239,68,68,0.3)] transition-colors"
          >
            <span className="w-[5px] h-[5px] bg-[#EF4444] rounded-full animate-pulse" />
            {pendingCount} pending
          </Link>
        )}
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 bg-[#6366F1] text-white text-[12px] font-medium h-[30px] px-3 rounded-[8px] hover:bg-[#5558E6] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Project
        </Link>
      </div>
    </div>
  );
}
