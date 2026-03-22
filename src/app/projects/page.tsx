"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Project, ChangeRequest } from "@/lib/types";
import { getProjects, saveProject } from "@/lib/storage";

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
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 100 + Math.random() * 120,
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

  useEffect(() => {
    getProjects().then((all) => {
      setProjects(all.filter((p) => p.status !== "Completed"));
      setLoaded(true);
    });
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

  if (!loaded) return null;

  return (
    <div>
      {showCashRain && <CashRain onComplete={handleCashRainComplete} />}
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
        <div className="text-center py-20 border border-dashed border-[#475569] rounded-2xl">
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
              (cr) => cr.status === "Pending"
            ).length;

            return (
              <div
                key={project.id}
                className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 hover:bg-[#334155] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#F1F5F9] truncate group-hover:text-[#818CF8] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-[#94A3B8] text-sm mt-0.5">
                      {project.clientName}
                    </p>
                    <p className="text-[#94A3B8]/70 text-xs mt-0.5">
                      {project.clientEmail}
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
                      .filter((cr) => cr.status === "Pending")
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
    </div>
  );
}
