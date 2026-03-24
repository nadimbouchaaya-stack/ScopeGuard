"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProjects } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import AppTopBar from "@/components/AppTopBar";

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
          // ignore
        }
      }
      if (resolvedName) setFirstName(resolvedName);

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

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const activeProjects = projects.filter(
    (p) => p.status === "Active" || p.status === "Pending Approval"
  );
  const activeCount = activeProjects.length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  const activeRevenue = activeProjects.reduce((sum, p) => sum + p.price, 0);
  const totalEarned = projects
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => {
      const crRevenue = p.changeRequests
        .filter((cr) => cr.status?.toLowerCase().trim() === "approved")
        .reduce((s, cr) => s + cr.additionalCost, 0);
      return sum + p.price + crRevenue;
    }, 0);

  // Pending CRs data
  const pendingCRs = projects.flatMap((p) =>
    p.changeRequests
      .filter((cr) => cr.status?.toLowerCase().trim() === "pending")
      .map((cr) => ({ ...cr, projectName: p.name, clientName: p.clientName }))
  );
  const mostRecentCR = pendingCRs[0];

  // Recent activity
  const recentActivity = projects
    .flatMap((p) =>
      p.changeRequests.map((cr) => ({
        projectName: p.name,
        clientName: p.clientName,
        description: cr.description,
        status: cr.status,
        createdAt: cr.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Deadlines
  const deadlineProjects = projects
    .filter((p) => p.status !== "Completed" && p.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 4);

  // Monthly goal
  const goalTarget = Math.ceil((activeRevenue || 1000) / 1000) * 1000 * 1.5;

  // Scope tips
  const tips = [
    "Always get change requests in writing before starting extra work.",
    "Set clear boundaries in your initial scope document.",
    "Review your scope weekly to catch creep early.",
  ];

  // Revenue months for chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const currentMonth = now.getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonth - 6), currentMonth + 1);
  if (recentMonths.length < 7) {
    const needed = 7 - recentMonths.length;
    recentMonths.unshift(...months.slice(0, needed));
  }

  function timeAgo(dateStr: string) {
    const diff = now.getTime() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-[#07090F]">
      <AppTopBar title="Dashboard" subtitle={dateStr} />

      <div className="p-5 flex flex-col gap-4">
        {/* SECTION A — HERO BANNER */}
        <div className="bg-[#0F1322] border border-[rgba(99,102,241,0.18)] rounded-[16px] p-6 md:p-8 flex items-center gap-6 relative overflow-hidden min-h-[160px]">
          {/* Background decorations */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-16 right-20 w-[200px] h-[200px] rounded-full bg-[rgba(99,102,241,0.08)] pointer-events-none" />
          <div className="absolute top-5 right-40 w-[120px] h-[120px] rounded-full bg-[rgba(139,92,246,0.06)] pointer-events-none" />

          {/* Left content */}
          <div className="flex-1 relative z-10">
            {pendingCRCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.25)] rounded-full px-3 py-1 text-[11px] text-[#A5B4FC] mb-2">
                <span className="w-[5px] h-[5px] bg-[#6366F1] rounded-full animate-pulse" />
                {pendingCRCount} change request{pendingCRCount !== 1 ? "s" : ""} need review
              </div>
            )}

            <h1 className="text-[22px] font-medium text-white leading-snug my-2">
              Welcome back{firstName ? `, ${firstName}` : ""}.
              <br />
              Your scope is protected.
            </h1>

            <p className="text-[13px] text-[rgba(255,255,255,0.35)] mb-4">
              ${activeRevenue.toLocaleString()} active across {activeCount} project{activeCount !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-2">
              {pendingCRCount > 0 && (
                <Link
                  href="/pending-approvals"
                  className="inline-flex items-center gap-2 bg-[#6366F1] rounded-[9px] h-[34px] px-4 text-white text-[12px] font-medium hover:bg-[#5558E6] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Review requests
                </Link>
              )}
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[9px] h-[34px] px-4 text-[rgba(255,255,255,0.5)] text-[12px] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                View all projects
              </Link>
            </div>
          </div>

          {/* Right — Animated shield */}
          <div className="hidden md:flex w-[120px] h-[120px] relative items-center justify-center flex-shrink-0">
            {/* Ring 1 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(99,102,241,0.2)", animation: "spin-slow 10s linear infinite" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[7px] h-[7px] bg-[#6366F1] rounded-full" />
            </div>
            {/* Ring 2 */}
            <div
              className="absolute inset-[10px] rounded-full"
              style={{ border: "1px dashed rgba(99,102,241,0.12)", animation: "spin-slow 16s linear infinite reverse" }}
            />
            {/* Glow */}
            <div className="absolute inset-[20px] rounded-full bg-[rgba(99,102,241,0.1)]" />
            {/* Shield */}
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ animation: "float 3s ease-in-out infinite" }}>
              <path d="M36 8L58 18V40C58 52 48 61 36 66C24 61 14 52 14 40V18L36 8Z" fill="rgba(99,102,241,0.2)" stroke="#6366F1" strokeWidth="1.5" />
              <path d="M36 14L54 22V40C54 50 46 58 36 62C26 58 18 50 18 40V22L36 14Z" fill="rgba(99,102,241,0.15)" />
              <path d="M36 14L54 22V28L36 20L18 28V22L36 14Z" fill="rgba(255,255,255,0.06)" />
              <path d="M27 36l7 7 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* SECTION B — CR ALERT */}
        {pendingCRs.length > 0 && mostRecentCR && (
          <div className="bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.2)] rounded-[12px] p-3.5 pl-4 flex items-center gap-3">
            <div className="w-[34px] h-[34px] bg-[rgba(239,68,68,0.15)] rounded-[9px] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white">{mostRecentCR.projectName} — change requested</p>
              <p className="text-[11px] text-[rgba(255,255,255,0.3)] truncate">
                {mostRecentCR.clientName} · {mostRecentCR.description.slice(0, 60)}
              </p>
            </div>
            <Link
              href="/pending-approvals"
              className="ml-auto bg-[#6366F1] h-[30px] px-3.5 rounded-[8px] text-white text-[11px] font-medium flex items-center hover:bg-[#5558E6] transition-colors flex-shrink-0"
            >
              Review now
            </Link>
          </div>
        )}

        {/* SECTION C — STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
          {/* Revenue */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-colors cursor-default group">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px] bg-[#6366F1]" />
            <svg className="absolute bottom-0 right-0 opacity-30" width="60" height="30" viewBox="0 0 60 30"><path d="M0 25 Q15 10 30 18 T60 8" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" /></svg>
            <div className="w-[32px] h-[32px] rounded-[10px] bg-[rgba(99,102,241,0.12)] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-white">${activeRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">Active revenue</p>
          </div>

          {/* Active projects */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-colors cursor-default">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px] bg-[#34D399]" />
            <svg className="absolute bottom-0 right-0 opacity-30" width="60" height="30" viewBox="0 0 60 30"><path d="M0 22 Q15 5 30 15 T60 5" fill="none" stroke="rgba(52,211,153,0.5)" strokeWidth="1.5" /></svg>
            <div className="w-[32px] h-[32px] rounded-[10px] bg-[rgba(52,211,153,0.12)] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-white">{activeCount}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">Active projects</p>
          </div>

          {/* Pending CRs */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-colors cursor-default">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px] bg-[#EF4444]" />
            <svg className="absolute bottom-0 right-0 opacity-30" width="60" height="30" viewBox="0 0 60 30"><path d="M0 20 Q15 8 30 22 T60 10" fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" /></svg>
            <div className="w-[32px] h-[32px] rounded-[10px] bg-[rgba(239,68,68,0.12)] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-white">{pendingCRCount}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">Pending CRs</p>
            <p className={`text-[10px] mt-1 ${pendingCRCount > 0 ? "text-[#FCA5A5]" : "text-[#34D399]"}`}>
              {pendingCRCount > 0 ? "Needs review" : "All clear"}
            </p>
          </div>

          {/* Completed */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 relative overflow-hidden hover:border-[rgba(99,102,241,0.3)] transition-colors cursor-default">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px] bg-[#FCD34D]" />
            <svg className="absolute bottom-0 right-0 opacity-30" width="60" height="30" viewBox="0 0 60 30"><path d="M0 28 Q15 12 30 20 T60 4" fill="none" stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" /></svg>
            <div className="w-[32px] h-[32px] rounded-[10px] bg-[rgba(251,191,36,0.12)] flex items-center justify-center mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p className="text-[18px] font-semibold text-white">{completedCount}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-0.5">Completed</p>
            <p className="text-[10px] mt-1 text-[rgba(255,255,255,0.2)]">All time</p>
          </div>
        </div>

        {/* SECTION D — TWO COLUMN */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
          {/* LEFT — Active projects */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)]">Active Projects</span>
              <Link href="/projects" className="text-[11px] text-[#6366F1] hover:text-[#818CF8] transition-colors">See all →</Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[12px] text-[rgba(255,255,255,0.3)]">No active projects yet</p>
                <Link href="/projects/new" className="text-[11px] text-[#6366F1] hover:text-[#818CF8] mt-2 inline-block">Create a project</Link>
              </div>
            ) : (
              <div>
                {activeProjects.slice(0, 4).map((project, i) => {
                  const hasPendingCR = project.changeRequests.some(
                    (cr) => cr.status?.toLowerCase().trim() === "pending"
                  );
                  const progress = project.deliverables.length > 0
                    ? (project.deliverables.filter((d) => d.completed).length / project.deliverables.length) * 100
                    : 0;
                  const barColor = hasPendingCR ? "#EF4444" : project.status === "Pending Approval" ? "#FCD34D" : "#34D399";
                  const chipColor = hasPendingCR
                    ? "bg-[rgba(239,68,68,0.15)] text-[#FCA5A5]"
                    : project.status === "Pending Approval"
                    ? "bg-[rgba(251,191,36,0.15)] text-[#FCD34D]"
                    : "bg-[rgba(52,211,153,0.15)] text-[#34D399]";
                  const chipLabel = hasPendingCR ? "CR Pending" : project.status === "Pending Approval" ? "Pending" : "Active";

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className={`py-[9px] flex items-center gap-[10px] ${i < activeProjects.slice(0, 4).length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}
                    >
                      <div className="w-[3px] self-stretch rounded-[2px] min-h-[36px]" style={{ backgroundColor: barColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{project.name}</p>
                        <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-0.5">{project.clientName} · {project.deliverables.filter((d) => d.completed).length}/{project.deliverables.length} deliverables</p>
                        <div className="h-[2px] bg-[rgba(255,255,255,0.06)] rounded mt-1.5">
                          <div className="h-full rounded" style={{ width: `${progress}%`, backgroundColor: barColor }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[12px] font-medium text-white">${project.price.toLocaleString()}</p>
                        <span className={`text-[9px] px-[7px] py-[2px] rounded-full font-medium ${chipColor}`}>{chipLabel}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3">
            {/* Revenue chart */}
            <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)]">Revenue</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.2)]">{now.getFullYear()}</span>
              </div>
              <div className="flex items-end gap-[5px] h-[80px]">
                {recentMonths.slice(-7).map((month, i) => {
                  const isCurrentMonth = i === recentMonths.slice(-7).length - 1;
                  const barHeight = isCurrentMonth ? 100 : 20 + Math.random() * 60;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-[3px] ${isCurrentMonth ? "bg-[#6366F1]" : "bg-[rgba(99,102,241,0.2)]"}`}
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className={`text-[9px] ${isCurrentMonth ? "text-[#6366F1]" : "text-[rgba(255,255,255,0.2)]"}`}>{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)] mb-3 block">Activity</span>
              {recentActivity.length === 0 ? (
                <p className="text-[11px] text-[rgba(255,255,255,0.25)] text-center py-4">No activity yet</p>
              ) : (
                <div>
                  {recentActivity.map((item, i) => {
                    const isPending = item.status?.toLowerCase().trim() === "pending";
                    const isApproved = item.status?.toLowerCase().trim() === "approved";
                    return (
                      <div key={i} className={`flex gap-[10px] py-2 ${i < recentActivity.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}>
                        <div className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0 ${
                          isPending ? "bg-[rgba(239,68,68,0.12)]" : isApproved ? "bg-[rgba(52,211,153,0.12)]" : "bg-[rgba(99,102,241,0.12)]"
                        }`}>
                          {isPending ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                          ) : isApproved ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-white truncate">{item.description}</p>
                          <p className="text-[10px] text-[rgba(255,255,255,0.25)] mt-0.5">{item.projectName} · {item.clientName}</p>
                        </div>
                        <span className="text-[10px] text-[rgba(255,255,255,0.2)] flex-shrink-0">{timeAgo(item.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION E — BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Upcoming deadlines */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)] mb-3 block">Upcoming Deadlines</span>
            {deadlineProjects.length === 0 ? (
              <p className="text-[11px] text-[rgba(255,255,255,0.25)] text-center py-4">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {deadlineProjects.map((project) => {
                  const daysLeft = Math.ceil(
                    (new Date(project.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const dotColor = daysLeft < 0 || daysLeft < 7 ? "#EF4444" : daysLeft < 14 ? "#FCD34D" : daysLeft < 30 ? "#6366F1" : "#34D399";
                  return (
                    <div key={project.id} className="flex items-center gap-2">
                      <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="flex-1 text-[12px] text-white truncate">{project.name}</span>
                      <span className="text-[10px] text-[rgba(255,255,255,0.25)] flex-shrink-0">
                        {new Date(project.deadline!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}
                        {daysLeft <= 0 ? "Overdue" : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly goal */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)] mb-3 block">Monthly Goal</span>
            <p className="text-[22px] font-medium text-white">${activeRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.25)] mt-1">of ${goalTarget.toLocaleString()} goal</p>
            <div className="h-[4px] bg-[rgba(255,255,255,0.06)] rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (activeRevenue / goalTarget) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-[rgba(255,255,255,0.2)]">$0</span>
              <span className="text-[10px] text-[#6366F1]">${activeRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-[rgba(255,255,255,0.2)]">${goalTarget.toLocaleString()}</span>
            </div>
          </div>

          {/* Scope tips */}
          <div className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-[rgba(255,255,255,0.35)] mb-3 block">Scope Tips</span>
            <div className="space-y-2.5">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-[18px] h-[18px] bg-[rgba(99,102,241,0.2)] rounded-[5px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] font-medium text-[#A5B4FC]">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-[rgba(255,255,255,0.4)] leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
