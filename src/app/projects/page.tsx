"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Project, ChangeRequest } from "@/lib/types";
import { getProjects, saveProject, deleteProject } from "@/lib/storage";
import { getProfile } from "@/lib/profile";

interface CashDrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

function CashRain({ onComplete, emoji = "💵" }: { onComplete: () => void; emoji?: string }) {
  const [drops] = useState<CashDrop[]>(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 20 + Math.random() * 24,
      rotation: Math.random() * 360,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute animate-cash-fall"
          style={{
            left: `${drop.left}%`,
            top: -50,
            fontSize: drop.size,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
            ["--rotation" as string]: `${drop.rotation}deg`,
          }}
        >
          {emoji}
        </div>
      ))}
      <style jsx>{`
        @keyframes cash-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(var(--rotation));
            opacity: 0;
          }
        }
        .animate-cash-fall {
          animation: cash-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

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
    let newDeadline = project.deadline;

    if (action === "Approved" && cr && cr.timeImpactDays > 0 && project.deadline) {
      const current = new Date(project.deadline);
      current.setDate(current.getDate() + cr.timeImpactDays);
      newDeadline = current.toISOString().split("T")[0];
    }

    const updatedProject: Project = {
      ...project,
      deadline: newDeadline,
      changeRequests: project.changeRequests.map((c) =>
        c.id === crId ? { ...c, status: action } : c
      ),
    };

    await saveProject(updatedProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? updatedProject : p))
    );

    if (action === "Approved") {
      setShowCashRain(true);
    }
  }

  const handleCashRainComplete = useCallback(() => setShowCashRain(false), []);

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

  if (!loaded) return null;

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

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl">
          <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-1">No active projects</h3>
          <p className="text-[#94A3B8] mb-6">Create a new project to get started.</p>
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
          {projects.map((project) => {
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
                {/* Sent badge + delete */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); setDeleteConfirmId(project.id); }}
                    className="text-[#94A3B8]/40 hover:text-[#F87171] transition-colors p-1 rounded-lg hover:bg-[#F87171]/10 opacity-0 group-hover:opacity-100"
                    title="Delete project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8]">
                    📤 Sent
                  </span>
                </div>

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
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ml-3 ${statusColors[project.status]}`}
                  >
                    {project.status}
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
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        project.revisionsUsed >= project.revisionLimit
                          ? "bg-[#F87171]"
                          : project.revisionsUsed >= project.revisionLimit * 0.66
                            ? "bg-[#FBBF24]"
                            : "bg-[#34D399]"
                      }`}
                      style={{
                        width: `${Math.min(100, (project.revisionsUsed / project.revisionLimit) * 100)}%`,
                      }}
                    />
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
                    >
                      Change Request
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
