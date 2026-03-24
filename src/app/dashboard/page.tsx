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
  });

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

  // Recent activity from CRs across all projects
  const recentActivity = projects
    .flatMap((p) =>
      p.changeRequests.map((cr) => ({
        projectName: p.name,
        description: cr.description,
        status: cr.status,
        cost: cr.additionalCost,
        days: cr.timeImpactDays,
      }))
    )
    .slice(0, 5);

  // Deadlines list for bottom row
  const deadlineProjects = projects
    .filter((p) => p.status !== "Completed" && p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  // Monthly goal (sum of all active project values)
  const monthlyGoal = activeRevenue + totalEarned;

  // Scope tips
  const tips = [
    "Always get change requests in writing before starting extra work.",
    "Set clear boundaries in your initial scope document.",
    "Use milestones to break large projects into manageable phases.",
    "Review your scope weekly to catch creep early.",
  ];

  return (
    <div className="min-h-screen bg-[#07090F]">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[14px] mx-4 mt-4 mb-6 bg-gradient-to-br from-[#0F1322] via-[#0B0E18] to-[#0F1322] border border-[rgba(99,102,241,0.15)]">
        {/* Gradient orbs */}
        <div className="absolute top-[-40px] left-[-40px] w-[200px] h-[200px] bg-[#6366F1]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-30px] right-[-30px] w-[160px] h-[160px] bg-[#818CF8]/8 rounded-full blur-[60px]" />

        <div className="relative flex items-center justify-between px-8 py-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9] mb-1">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="text-[#94A3B8] text-sm">
              {projects.length === 0
                ? "Create your first project to start protecting your work."
                : `You have ${activeCount} active project${activeCount !== 1 ? "s" : ""} and ${pendingCRCount} pending request${pendingCRCount !== 1 ? "s" : ""}.`}
            </p>
            {projects.length === 0 && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 mt-4 bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Your First Project
              </Link>
            )}
          </div>

          {/* Animated Shield */}
          <div className="hidden sm:flex items-center justify-center" style={{ animation: "float 4s ease-in-out infinite" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-[#6366F1]/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#6366F1] to-[#818CF8] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6366F1]/20">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              {/* Pulsing dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#34D399] rounded-full" style={{ animation: "pulse-slow 2s ease-in-out infinite" }} />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#818CF8] rounded-full" style={{ animation: "pulse-slow 2.5s ease-in-out infinite 0.5s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* CR Alert Banner */}
      {pendingCRCount > 0 && (
        <Link
          href="/pending-approvals"
          className="flex items-center gap-3 mx-4 mb-6 px-5 py-3.5 rounded-[14px] bg-[#FBBF24]/8 border border-[#FBBF24]/20 hover:border-[#FBBF24]/40 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#FBBF24]">
              {pendingCRCount} pending change request{pendingCRCount !== 1 ? "s" : ""} need your attention
            </p>
          </div>
          <svg className="w-4 h-4 text-[#FBBF24]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* 4-Column Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mx-4 mb-6">
        {/* Active Projects */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <span className="text-xs text-[#34D399] font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9]">{activeCount}</p>
          <p className="text-xs text-[#64748B] mt-1">Active projects</p>
        </div>

        {/* Active Revenue */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-[#34D399] font-medium">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9]">${activeRevenue.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Active revenue</p>
        </div>

        {/* Pending CR Value */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-[#FBBF24] font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9]">${pendingCRValue.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Pending CR value</p>
        </div>

        {/* Total Earned */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#818CF8]/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-[#818CF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <span className="text-xs text-[#818CF8] font-medium">Earned</span>
          </div>
          <p className="text-2xl font-bold text-[#F1F5F9]">${totalEarned.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Total earned</p>
        </div>
      </div>

      {/* Two-Column Layout: Active Projects + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mx-4 mb-6">
        {/* Active Projects Panel - 3 cols */}
        <div className="lg:col-span-3 rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Active Projects</h2>
            <Link href="/projects" className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors font-medium">
              View all
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#6366F1]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-sm text-[#64748B] mb-3">No active projects yet</p>
              <Link
                href="/projects/new"
                className="text-xs text-[#6366F1] hover:text-[#818CF8] font-medium transition-colors"
              >
                Create a project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeProjects.slice(0, 5).map((project) => {
                const pendingCrs = project.changeRequests.filter(
                  (cr) => cr.status?.toLowerCase().trim() === "pending"
                ).length;
                const daysLeft = project.deadline
                  ? Math.ceil((new Date(project.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#0F1322] border border-[rgba(71,85,105,0.15)] hover:border-[rgba(99,102,241,0.3)] transition-colors group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#34D399] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F1F5F9] truncate group-hover:text-[#818CF8] transition-colors">
                        {project.name}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {project.clientName} &middot; ${project.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {pendingCrs > 0 && (
                        <span className="text-xs font-medium text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-0.5 rounded-full">
                          {pendingCrs} CR{pendingCrs !== 1 ? "s" : ""}
                        </span>
                      )}
                      {daysLeft !== null && daysLeft <= 7 && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          daysLeft <= 2
                            ? "text-[#F87171] bg-[#F87171]/10"
                            : "text-[#FBBF24] bg-[#FBBF24]/10"
                        }`}>
                          {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-[#475569] group-hover:text-[#6366F1] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed - 2 cols */}
        <div className="lg:col-span-2 rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Recent Activity</h2>

          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#64748B]">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.status?.toLowerCase().trim() === "approved"
                      ? "bg-[#34D399]/10"
                      : item.status?.toLowerCase().trim() === "declined"
                      ? "bg-[#F87171]/10"
                      : "bg-[#FBBF24]/10"
                  }`}>
                    {item.status?.toLowerCase().trim() === "approved" ? (
                      <svg className="w-3.5 h-3.5 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : item.status?.toLowerCase().trim() === "declined" ? (
                      <svg className="w-3.5 h-3.5 text-[#F87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#F1F5F9] truncate">{item.description}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {item.projectName} &middot; +${item.cost.toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                    item.status?.toLowerCase().trim() === "approved"
                      ? "text-[#34D399] bg-[#34D399]/10"
                      : item.status?.toLowerCase().trim() === "declined"
                      ? "text-[#F87171] bg-[#F87171]/10"
                      : "text-[#FBBF24] bg-[#FBBF24]/10"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Deadlines + Quick Actions + Scope Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mx-4 mb-8">
        {/* Upcoming Deadlines */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Upcoming Deadlines</h2>
            <span className="text-xs text-[#64748B]">{upcomingDeadlines.length} due soon</span>
          </div>

          {deadlineProjects.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-4">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2.5">
              {deadlineProjects.map((project) => {
                const daysLeft = Math.ceil(
                  (new Date(project.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={project.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${
                      daysLeft <= 2 ? "bg-[#F87171]" : daysLeft <= 5 ? "bg-[#FBBF24]" : "bg-[#34D399]"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#F1F5F9] truncate">{project.name}</p>
                      <p className="text-[10px] text-[#64748B]">
                        {new Date(project.deadline!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${
                      daysLeft <= 0 ? "text-[#F87171]" : daysLeft <= 2 ? "text-[#F87171]" : "text-[#FBBF24]"
                    }`}>
                      {daysLeft <= 0 ? "Overdue" : `${daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions / Monthly Goal */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/projects/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F1322] border border-[rgba(71,85,105,0.15)] hover:border-[rgba(99,102,241,0.3)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">New Project</span>
            </Link>
            <Link
              href="/pending-approvals"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F1322] border border-[rgba(71,85,105,0.15)] hover:border-[rgba(99,102,241,0.3)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">Pending Approvals</span>
              {pendingCRCount > 0 && (
                <span className="ml-auto text-xs font-bold text-white bg-[#F87171] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCRCount}
                </span>
              )}
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F1322] border border-[rgba(71,85,105,0.15)] hover:border-[rgba(99,102,241,0.3)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
              </div>
              <span className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">All Projects</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F1322] border border-[rgba(71,85,105,0.15)] hover:border-[rgba(99,102,241,0.3)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#94A3B8]/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">Settings</span>
            </Link>
          </div>

          {/* Monthly snapshot */}
          {projects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[rgba(71,85,105,0.2)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#64748B]">Total portfolio</span>
                <span className="text-xs font-semibold text-[#F1F5F9]">${monthlyGoal.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-[#0F1322] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-500"
                  style={{ width: `${monthlyGoal > 0 ? Math.min(100, (totalEarned / monthlyGoal) * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[#64748B]">${totalEarned.toLocaleString()} earned</span>
                <span className="text-[10px] text-[#64748B]">{completedCount} completed</span>
              </div>
            </div>
          )}
        </div>

        {/* Scope Tips */}
        <div className="rounded-[14px] bg-[#0B0E18] border border-[rgba(71,85,105,0.25)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Scope Tips</h2>
          </div>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#6366F1]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#6366F1]">{i + 1}</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
