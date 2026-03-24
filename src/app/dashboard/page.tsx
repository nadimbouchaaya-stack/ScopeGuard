"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProjects } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [pendingCRCount, setPendingCRCount] = useState(0);
  const [projectIds, setProjectIds] = useState<string[]>([]);

  async function fetchPendingCount(supabase: ReturnType<typeof createClient>, pIds: string[]) {
    if (pIds.length === 0) return;
    const { data: crs } = await supabase
      .from("change_requests")
      .select("id, status")
      .in("project_id", pIds);
    const count = crs?.filter(
      (cr: { id: string; status: string }) => cr.status?.toLowerCase().trim() === "pending"
    ).length ?? 0;
    setPendingCRCount(count);
  }

  useEffect(() => {
    getProjects().then((p) => {
      setProjects(p);
      setLoaded(true);
    });

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // Resolve first name: user_metadata → user_profiles
      let resolvedName: string | null = null;
      const metaName = user.user_metadata?.full_name;
      if (metaName?.trim()) {
        resolvedName = metaName.trim().split(" ")[0];
      }
      if (!resolvedName) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          if (profile?.full_name?.trim()) {
            resolvedName = profile.full_name.trim().split(" ")[0];
          }
        } catch {
          // user_profiles query failed — ignore
        }
      }
      if (resolvedName) setFirstName(resolvedName);

      // Fetch project IDs + pending CR count
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id);
      const pIds = userProjects?.map((p: { id: string }) => p.id) ?? [];
      setProjectIds(pIds);
      await fetchPendingCount(supabase, pIds);
    });
  }, []);

  // Real-time subscription for new CRs
  useEffect(() => {
    if (projectIds.length === 0) return;
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-cr-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "change_requests",
          filter: `project_id=in.(${projectIds.join(",")})`,
        },
        () => fetchPendingCount(supabase, projectIds)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectIds]);

  if (!loaded) return <DashboardSkeleton />;

  const activeProjects = projects.filter(
    (p) => p.status === "Active" || p.status === "Pending Approval"
  );
  const activeCount = activeProjects.length;
  const completedCount = projects.filter(
    (p) => p.status === "Completed"
  ).length;

  const now = new Date();
  const upcomingDeadlines = projects.filter((p) => {
    if (p.status === "Completed" || !p.deadline) return false;
    const diff = Math.ceil(
      (new Date(p.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff <= 7;
  }).length;

  // Revenue stats
  const activeRevenue = activeProjects.reduce((sum, p) => sum + p.price, 0);
  const pendingCRValue = activeProjects.reduce((sum, p) => {
    return sum + p.changeRequests
      .filter((cr) => cr.status?.toLowerCase().trim() === "pending")
      .reduce((s, cr) => s + cr.additionalCost, 0);
  }, 0);
  const totalEarned = projects
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => {
      const crRevenue = p.changeRequests
        .filter((cr) => cr.status?.toLowerCase().trim() === "approved")
        .reduce((s, cr) => s + cr.additionalCost, 0);
      return sum + p.price + crRevenue;
    }, 0);

  const cards: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    badge: string | null;
    enabled: boolean;
    notificationCount?: number;
  }> = [
    {
      title: "New Project",
      description: "Create a new project and define your scope",
      href: "/projects/new",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      color: "indigo",
      badge: null,
      enabled: true,
    },
    {
      title: "Active Projects",
      description: "Manage your ongoing projects and track scope",
      href: "/projects",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      color: "green",
      badge: activeCount > 0 ? `${activeCount} active` : null,
      enabled: true,
    },
    {
      title: "Project History",
      description: "View completed projects grouped by client",
      href: "/history",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "slate",
      badge: completedCount > 0 ? `${completedCount} completed` : null,
      enabled: true,
    },
    {
      title: "Deadlines",
      description: "Track upcoming deadlines across all projects",
      href: "/deadlines",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: "amber",
      badge: upcomingDeadlines > 0 ? `${upcomingDeadlines} due soon` : null,
      enabled: true,
    },
    {
      title: "Pending Approvals",
      description: "Review and respond to incoming requests",
      href: "/pending-approvals",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "indigo",
      badge: null,
      enabled: true,
      notificationCount: pendingCRCount,
    },
    {
      title: "Subscription & Billing",
      description: "Coming soon",
      href: "#",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      color: "slate",
      badge: null,
      enabled: false,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string; badgeBg: string; badgeText: string }> = {
    indigo: {
      bg: "bg-[#6366F1]/10",
      border: "border-[#6366F1]/20 hover:border-[#6366F1]/40",
      icon: "text-[#6366F1]",
      hover: "group-hover:text-[#818CF8]",
      badgeBg: "bg-[#6366F1]/15",
      badgeText: "text-[#818CF8]",
    },
    green: {
      bg: "bg-[#34D399]/10",
      border: "border-[#34D399]/20 hover:border-[#34D399]/40",
      icon: "text-[#34D399]",
      hover: "group-hover:text-[#6EE7B7]",
      badgeBg: "bg-[#34D399]/15",
      badgeText: "text-[#34D399]",
    },
    slate: {
      bg: "bg-[#94A3B8]/10",
      border: "border-[#94A3B8]/20 hover:border-[#94A3B8]/40",
      icon: "text-[#94A3B8]",
      hover: "group-hover:text-[#CBD5E1]",
      badgeBg: "bg-[#94A3B8]/15",
      badgeText: "text-[#94A3B8]",
    },
    amber: {
      bg: "bg-[#FBBF24]/10",
      border: "border-[#FBBF24]/20 hover:border-[#FBBF24]/40",
      icon: "text-[#FBBF24]",
      hover: "group-hover:text-[#FCD34D]",
      badgeBg: "bg-[#FBBF24]/15",
      badgeText: "text-[#FBBF24]",
    },
  };

  return (
    <div>
      <div className="text-center mb-8 sm:mb-12 pt-2 sm:pt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] mb-2">
          {firstName ? `Welcome back, ${firstName}!` : "Welcome back!"} 👋
        </h1>
        <p className="text-[#94A3B8] text-sm sm:text-base">
          Protect your freelance projects from scope creep.
        </p>
      </div>

      {/* Revenue Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#34D399]/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-[#F1F5F9]">${activeRevenue.toLocaleString()}</p>
              <p className="text-xs text-[#94A3B8]">Active Revenue</p>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FBBF24]/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-[#F1F5F9]">${pendingCRValue.toLocaleString()}</p>
              <p className="text-xs text-[#94A3B8]">Pending CR Value</p>
            </div>
          </div>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6366F1]/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-[#F1F5F9]">${totalEarned.toLocaleString()}</p>
              <p className="text-xs text-[#94A3B8]">Total Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding state for new users */}
      {projects.length === 0 && (
        <div className="max-w-lg mx-auto text-center py-8 mb-8">
          <div className="w-20 h-20 bg-[#6366F1]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">Get started with ScopeGuard</h2>
          <p className="text-[#94A3B8] text-sm mb-6">
            Create your first project to start protecting your freelance work from scope creep.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Your First Project
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
        {cards.map((card) => {
          const colors = colorMap[card.color];

          if (!card.enabled) {
            return (
              <div
                key={card.title}
                className={`relative bg-[#1E293B] border ${colors.border.split(" ")[0]} rounded-xl p-5 sm:p-8 opacity-60 cursor-default`}
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-5 ${colors.icon}`}>
                  {card.icon}
                </div>
                <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">
                  {card.title}
                </h2>
                <p className="text-[#94A3B8] text-sm">{card.description}</p>
              </div>
            );
          }

          return (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative bg-[#1E293B] border ${colors.border} rounded-xl p-5 sm:p-8 transition-all hover:bg-[#334155] hover:scale-[1.02] hover:shadow-lg`}
            >
              {card.badge && (
                <span className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full ${colors.badgeBg} ${colors.badgeText}`}>
                  {card.badge}
                </span>
              )}
              {card.notificationCount != null && card.notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5 animate-pulse">
                  {card.notificationCount}
                </span>
              )}
              <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-5 ${colors.icon}`}>
                {card.icon}
              </div>
              <h2 className={`text-xl font-semibold text-[#F1F5F9] mb-2 ${colors.hover} transition-colors`}>
                {card.title}
              </h2>
              <p className="text-[#94A3B8] text-sm">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
