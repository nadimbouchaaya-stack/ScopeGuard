"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/types";
import { getProjects, saveProject, deleteProject } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/profile";
import CashRain from "@/components/CashRain";
import { ProjectsSkeleton } from "@/components/LoadingSkeleton";

const statusColors: Record<string, string> = {
  Active: "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30",
  "Pending Approval":
    "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30",
  Completed: "bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30",
};

export default function ActiveProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showCashRain, setShowCashRain] = useState(false);
  const [cashRainEmoji, setCashRainEmoji] = useState("💵");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [quickMenuId, setQuickMenuId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [completeConfirmId, setCompleteConfirmId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    getProjects().then((all) => {
      setProjects(all.filter((p) => p.status !== "Completed"));
      setLoaded(true);
    });
    getProfile()
      .then((p) => setCashRainEmoji(p.cash_rain_emoji))
      .catch(() => {});
  }, []);

  async function handleChangeRequest(
    projectId: string,
    crId: string,
    action: "Approved" | "Declined"
  ) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const cr = project.changeRequests.find((c) => c.id === crId);
    if (!cr) return;

    const supabase = createClient();

    // Targeted CR status update
    const { error: crErr } = await supabase
      .from("change_requests")
      .update({ status: action })
      .eq("id", crId);

    if (crErr) {
      console.error("[Projects] update CR error:", crErr);
      return;
    }

    let newDeadline = project.deadline;

    // If approved, increment revisions_used and extend deadline
    if (action === "Approved") {
      const { data: proj } = await supabase
        .from("projects")
        .select("revisions_used, deadline")
        .eq("id", projectId)
        .single();

      const currentUsed = proj?.revisions_used ?? project.revisionsUsed;
      const updateFields: Record<string, unknown> = {
        revisions_used: currentUsed + 1,
      };

      const deadline = proj?.deadline ?? project.deadline;
      if (cr.timeImpactDays > 0 && deadline) {
        const current = new Date(deadline);
        current.setDate(current.getDate() + cr.timeImpactDays);
        newDeadline = current.toISOString().split("T")[0];
        updateFields.deadline = newDeadline;
      }

      await supabase
        .from("projects")
        .update(updateFields)
        .eq("id", projectId);
    }

    // Update local state
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              deadline: newDeadline,
              revisionsUsed: action === "Approved" ? p.revisionsUsed + 1 : p.revisionsUsed,
              changeRequests: p.changeRequests.map((c) =>
                c.id === crId ? { ...c, status: action } : c
              ),
            }
          : p
      )
    );

    if (action === "Approved") {
      setShowCashRain(true);
    }

    // Send email notification to client (fire and forget)
    fetch("/api/cr-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        projectName: project.name,
        clientName: project.clientName,
        clientEmail: project.clientEmail,
        action,
        description: cr.description,
        additionalCost: cr.additionalCost,
        timeImpactDays: cr.timeImpactDays,
      }),
    }).catch(() => {});
  }

  const handleCashRainComplete = useCallback(() => setShowCashRain(false), []);

  const router = useRouter();

  async function handleMarkComplete(id: string) {
    if (completing) return;
    setCompleting(true);
    try {
      const project = projects.find((p) => p.id === id);
      if (!project) return;
      await saveProject({ ...project, status: "Completed" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to mark complete:", err);
    }
    setCompleting(false);
    setCompleteConfirmId(null);
  }

  async function handleDeleteProject(id: string) {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
    setDeleting(false);
    setDeleteConfirmId(null);
  }

  if (!loaded) return <ProjectsSkeleton />;

  return (
    <div>
      {showCashRain && <CashRain onComplete={handleCashRainComplete} emoji={cashRainEmoji} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">Active Projects</h1>
          <p className="text-[#94A3B8] mt-1 text-sm sm:text-base">
            Manage your active projects and track scope changes.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or clients..."
              className="w-full bg-[#1E293B] border border-[#475569] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl">
          <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-1">No active projects</h3>
          <p className="text-[#94A3B8] mb-2">Create a new project to get started.</p>
          <p className="text-[#94A3B8]/60 text-xs mb-6">Looking for a project shared with you? Use the portal link sent to your email.</p>
          <Link
            href="/projects/new"
            className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-medium px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.filter((p) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
          }).map((project) => {
            const isOverdue = project.deadline && new Date(project.deadline) < new Date(new Date().toDateString());
            const daysLeft = project.deadline
              ? Math.ceil((new Date(project.deadline).getTime() - new Date(new Date().toDateString()).getTime()) / (1000 * 60 * 60 * 24))
              : null;
            const pendingRequests = project.changeRequests.filter(
              (cr) => cr.status?.toLowerCase().trim() === "pending"
            ).length;

            const totalCRs = project.changeRequests.length;
            const approvedCRs = project.changeRequests.filter(
              (cr) => cr.status?.toLowerCase().trim() === "approved"
            ).length;
            const approvalRate = totalCRs > 0 ? Math.round((approvedCRs / totalCRs) * 100) : -1;

            const approvalStyle =
              approvalRate < 0
                ? "text-[#94A3B8] bg-[#475569]/50 border-[#475569]"
                : approvalRate < 50
                  ? "text-[#FBBF24] bg-[#FBBF24]/20 border-[#FBBF24]/30"
                  : approvalRate < 80
                    ? "text-[#60A5FA] bg-[#3B82F6]/20 border-[#3B82F6]/30"
                    : "text-[#34D399] bg-[#34D399]/20 border-[#34D399]/30";

            return (
              <div
                key={project.id}
                className="bg-[#1E293B] border border-[#475569] border-t-2 border-t-[#6366F1] rounded-xl p-6 hover:bg-[#334155] transition-colors group relative"
              >
                {/* Quick actions menu */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={(e) => { e.preventDefault(); setQuickMenuId(quickMenuId === project.id ? null : project.id); }}
                      className="text-[#94A3B8]/60 hover:text-[#F1F5F9] transition-colors p-1.5 rounded-lg hover:bg-[#475569]/50 opacity-0 group-hover:opacity-100"
                      title="Actions"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </button>
                    {quickMenuId === project.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setQuickMenuId(null)} />
                        <div className="absolute right-0 top-8 z-50 w-48 bg-[#1E293B] border border-[#475569] rounded-lg shadow-xl py-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://tryscopeguard.com/portal/${project.id}`);
                              setCopiedToast(project.id);
                              setTimeout(() => setCopiedToast(null), 2000);
                              setQuickMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#F1F5F9] hover:bg-[#334155] transition-colors flex items-center gap-2.5"
                          >
                            <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.124a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.25" />
                            </svg>
                            Copy Portal Link
                          </button>
                          <button
                            onClick={() => { setQuickMenuId(null); router.push(`/projects/${project.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#F1F5F9] hover:bg-[#334155] transition-colors flex items-center gap-2.5"
                          >
                            <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                            Edit Project
                          </button>
                          <button
                            onClick={() => { setQuickMenuId(null); setCompleteConfirmId(project.id); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#34D399] hover:bg-[#334155] transition-colors flex items-center gap-2.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark Complete
                          </button>
                          <div className="border-t border-[#475569] my-1" />
                          <button
                            onClick={() => { setQuickMenuId(null); setDeleteConfirmId(project.id); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#F87171] hover:bg-[#334155] transition-colors flex items-center gap-2.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Copied toast */}
                {copiedToast === project.id && (
                  <div className="absolute top-3 left-3 bg-[#34D399]/20 border border-[#34D399]/30 text-[#34D399] text-xs font-medium px-2.5 py-1 rounded-lg">
                    Copied!
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 pr-16">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-lg font-semibold text-[#F1F5F9] truncate group-hover:text-[#818CF8] transition-colors hover:underline block"
                    >
                      {project.name}
                    </Link>
                    <p className="text-[#94A3B8] text-sm mt-0.5">
                      {project.clientName}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Scope sent to {project.clientName}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ml-3 ${
                      isOverdue
                        ? "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30"
                        : pendingRequests > 0
                          ? "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30"
                          : statusColors[project.status]
                    }`}
                  >
                    {isOverdue ? "Overdue" : pendingRequests > 0 ? "Pending Review" : project.status === "Pending Approval" ? "Awaiting Approval" : project.status}
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94A3B8]">Revisions</span>
                    <span className="font-medium">
                      <span className={project.revisionsUsed >= project.revisionLimit ? "text-[#F87171]" : "text-[#F1F5F9]"}>
                        {project.revisionsUsed}
                      </span>
                      <span className="text-[#94A3B8]/60">/{project.revisionLimit}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#475569]/50 rounded-full h-1.5">
                    {(() => {
                      const pct = project.revisionLimit > 0 ? project.revisionsUsed / project.revisionLimit : 0;
                      const barColor = pct === 0
                        ? "bg-[#6366F1]"
                        : pct <= 0.5
                          ? "bg-[#34D399]"
                          : pct <= 0.8
                            ? "bg-[#FBBF24]"
                            : "bg-[#F87171] animate-pulse";
                      return (
                        <div
                          className={`h-1.5 rounded-full transition-all ${barColor}`}
                          style={{
                            width: `${Math.min(100, pct * 100)}%`,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94A3B8]">Deliverables</span>
                    <span className="font-medium text-[#F1F5F9]">
                      {project.deliverables.filter((d) => d.completed).length}/
                      {project.deliverables.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#94A3B8]">Price</span>
                    <span className="font-medium text-[#F1F5F9]">${project.price.toLocaleString()}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#94A3B8]">Deadline</span>
                      <span className={`font-medium ${
                        isOverdue ? "text-[#F87171]"
                        : daysLeft !== null && daysLeft <= 1 ? "text-[#F87171]"
                        : daysLeft !== null && daysLeft <= 3 ? "text-[#FB923C]"
                        : daysLeft !== null && daysLeft <= 7 ? "text-[#FBBF24]"
                        : "text-[#F1F5F9]"
                      }`}>
                        {new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {isOverdue && <span className="ml-1.5 text-xs bg-[#F87171]/15 text-[#F87171] px-1.5 py-0.5 rounded-full">OVERDUE</span>}
                        {!isOverdue && daysLeft !== null && daysLeft <= 1 && <span className="ml-1.5 text-xs bg-[#F87171]/15 text-[#F87171] px-1.5 py-0.5 rounded-full">Due {daysLeft === 0 ? "today" : "tomorrow"}</span>}
                        {!isOverdue && daysLeft !== null && daysLeft >= 2 && daysLeft <= 3 && <span className="ml-1.5 text-xs bg-[#FB923C]/15 text-[#FB923C] px-1.5 py-0.5 rounded-full">Due soon</span>}
                      </span>
                    </div>
                  )}
                  {pendingRequests > 0 && (
                    <button
                      onClick={() =>
                        setExpandedProject(
                          expandedProject === project.id ? null : project.id
                        )
                      }
                      className="flex items-center justify-between w-full text-[#FBBF24] text-sm hover:text-[#FCD34D] transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {pendingRequests} pending change request{pendingRequests > 1 ? "s" : ""}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedProject === project.id ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Expandable pending change requests */}
                {expandedProject === project.id && pendingRequests > 0 && (
                  <div className="space-y-3 mb-4">
                    {project.changeRequests
                      .filter((cr) => cr.status?.toLowerCase().trim() === "pending")
                      .map((cr) => (
                        <div
                          key={cr.id}
                          className="bg-[#0F172A]/50 border border-[#475569]/50 rounded-lg p-3"
                        >
                          <p className="text-[#F1F5F9] text-sm font-medium mb-1.5">
                            {cr.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-[#94A3B8] mb-3">
                            <span>
                              Cost:{" "}
                              <span className="text-[#F1F5F9] font-medium">
                                +${cr.additionalCost.toLocaleString()}
                              </span>
                            </span>
                            <span>
                              Deadline:{" "}
                              <span className="text-[#F1F5F9] font-medium">
                                +{cr.timeImpactDays} day
                                {cr.timeImpactDays === 1 ? "" : "s"}
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleChangeRequest(project.id, cr.id, "Approved")
                              }
                              className="bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleChangeRequest(project.id, cr.id, "Declined")
                              }
                              className="bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Approval rate bubble */}
                <div className="flex items-center justify-end mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-center ${approvalStyle}`}>
                    <span className="text-sm font-bold leading-none">
                      {approvalRate < 0 ? "—" : `${approvalRate}%`}
                    </span>
                    <span className="text-[10px] leading-none opacity-70">
                      {approvalRate < 0 ? "no requests" : "approval"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-[#475569]">
                  {project.revisionsUsed >= project.revisionLimit ? (
                    <span className="flex-1 text-center text-sm font-medium py-2 rounded-lg bg-[#F87171]/10 text-[#F87171] cursor-not-allowed">
                      Limit Reached
                    </span>
                  ) : (
                    <Link
                      href={`/projects/${project.id}/change-request`}
                      className="flex-1 text-center text-sm font-medium py-2 rounded-lg bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                      title="Record a change request that came in outside the portal"
                    >
                      Log Change
                    </Link>
                  )}
                  <Link
                    href={`/portal/${project.id}`}
                    className="flex-1 text-center text-sm font-medium py-2 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] transition-colors"
                  >
                    Client Portal
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Complete confirmation modal */}
      {completeConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setCompleteConfirmId(null)}>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#34D399]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#F1F5F9] text-center mb-2">Mark Complete</h3>
            <p className="text-sm text-[#94A3B8] text-center mb-6">
              Move this project to history? You can still view it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCompleteConfirmId(null)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkComplete(completeConfirmId)}
                disabled={completing}
                className="flex-1 bg-[#34D399] hover:bg-[#2BC48E] disabled:opacity-50 text-[#0F172A] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {completing ? "Completing..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#F87171]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#F87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#F1F5F9] text-center mb-2">Delete Project</h3>
            <p className="text-sm text-[#94A3B8] text-center mb-6">
              Are you sure you want to delete this project? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 bg-[#F87171] hover:bg-[#EF4444] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
