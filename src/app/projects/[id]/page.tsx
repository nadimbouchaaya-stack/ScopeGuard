"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";
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
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(var(--rotation)); opacity: 0; }
        }
        .animate-cash-fall { animation: cash-fall linear forwards; }
      `}</style>
    </div>
  );
}

const crStatusStyles: Record<string, string> = {
  Pending: "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30",
  Approved: "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30",
  Declined: "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showCashRain, setShowCashRain] = useState(false);
  const [cashRainEmoji, setCashRainEmoji] = useState("💵");

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setProject(p);
      setLoaded(true);
    });
    getProfile()
      .then((p) => setCashRainEmoji(p.cash_rain_emoji))
      .catch(() => {});
  }, [projectId]);

  async function handleChangeRequest(
    crId: string,
    action: "Approved" | "Declined"
  ) {
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
    setProject(updatedProject);

    if (action === "Approved") {
      setShowCashRain(true);
    }
  }

  const handleCashRainComplete = useCallback(() => setShowCashRain(false), []);

  if (!loaded) return null;

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Project not found</h2>
        <p className="text-[#94A3B8] mb-6">This project may have been deleted.</p>
        <Link href="/projects" className="text-[#818CF8] hover:text-[#A5B4FC] font-medium">
          Back to Projects
        </Link>
      </div>
    );
  }

  const totalApprovedCost = project.changeRequests
    .filter((cr) => cr.status === "Approved")
    .reduce((sum, cr) => sum + cr.additionalCost, 0);

  const totalApprovedDays = project.changeRequests
    .filter((cr) => cr.status === "Approved")
    .reduce((sum, cr) => sum + cr.timeImpactDays, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {showCashRain && <CashRain onComplete={handleCashRainComplete} emoji={cashRainEmoji} />}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/projects"
          className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">{project.name}</h1>
            <p className="text-[#94A3B8] mt-1 text-sm sm:text-base">
              {project.clientName} &middot; {project.clientEmail}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {project.status !== "Completed" && project.revisionsUsed < project.revisionLimit && (
              <Link
                href={`/projects/${project.id}/change-request`}
                className="bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                + Change Request
              </Link>
            )}
            <Link
              href={`/portal/${project.id}`}
              className="bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#818CF8] font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ===== SECTION 1: YOUR SCOPE ===== */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl overflow-hidden border-l-[3px] border-l-[#6366F1]">
          <div className="px-6 py-4 border-b border-[#475569] flex items-center gap-3">
            {/* FileText icon */}
            <div className="w-8 h-8 bg-[#6366F1]/15 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#6366F1]" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#F1F5F9]">Your Scope</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#0F172A] rounded-lg p-4">
                <p className="text-xs text-[#94A3B8] mb-1">Contract Value</p>
                <p className="text-lg font-semibold text-[#F1F5F9]">${project.price.toLocaleString()}</p>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-4">
                <p className="text-xs text-[#94A3B8] mb-1">Revision Limit</p>
                <p className="text-lg font-semibold text-[#F1F5F9]">
                  <span className={project.revisionsUsed >= project.revisionLimit ? "text-[#F87171]" : ""}>
                    {project.revisionsUsed}
                  </span>
                  <span className="text-[#94A3B8]/60">/{project.revisionLimit}</span>
                </p>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-[#94A3B8] mb-1">Deadline</p>
                <p className="text-lg font-semibold text-[#F1F5F9]">
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No deadline"}
                </p>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h3 className="text-sm font-medium text-[#94A3B8] mb-3">
                Deliverables ({project.deliverables.filter((d) => d.completed).length}/{project.deliverables.length})
              </h3>
              <div className="space-y-2">
                {project.deliverables.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-start gap-3 bg-[#0F172A]/50 rounded-lg px-4 py-3"
                  >
                    <span className="text-[#94A3B8]/50 text-sm font-medium mt-0.5 shrink-0 w-6">
                      {i + 1}.
                    </span>
                    <span className={`text-sm ${d.completed ? "text-[#94A3B8] line-through" : "text-[#F1F5F9]"}`}>
                      {d.description}
                    </span>
                    {d.completed && (
                      <svg className="w-4 h-4 text-[#34D399] shrink-0 ml-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {(project.deliverablesLink || project.paymentLink) && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-[#475569]">
                {project.deliverablesLink && (
                  <a
                    href={project.deliverablesLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#818CF8] hover:text-[#A5B4FC] transition-colors bg-[#6366F1]/10 px-3 py-1.5 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Deliverables Link
                  </a>
                )}
                {project.paymentLink && (
                  <a
                    href={project.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#818CF8] hover:text-[#A5B4FC] transition-colors bg-[#6366F1]/10 px-3 py-1.5 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                    Payment Link
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== SECTION 2: CLIENT REQUESTS ===== */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl overflow-hidden border-l-[3px] border-l-[#FBBF24]">
          <div className="px-6 py-4 border-b border-[#475569] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Inbox icon */}
              <div className="w-8 h-8 bg-[#FBBF24]/15 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-[18px] h-[18px] text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Client Requests</h2>
            </div>
            {project.changeRequests.length > 0 && (
              <div className="flex gap-4 text-xs text-[#94A3B8]">
                {totalApprovedCost > 0 && (
                  <span>
                    Added: <span className="text-[#34D399] font-medium">+${totalApprovedCost.toLocaleString()}</span>
                  </span>
                )}
                {totalApprovedDays > 0 && (
                  <span>
                    Extended: <span className="text-[#FBBF24] font-medium">+{totalApprovedDays} day{totalApprovedDays === 1 ? "" : "s"}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {project.changeRequests.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className="text-[#94A3B8] text-sm">
                  No change requests yet — your scope is holding strong 💪
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.changeRequests.map((cr) => (
                  <div
                    key={cr.id}
                    className="bg-[#0F172A]/50 border border-[#475569]/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-[#F1F5F9] text-sm font-medium">{cr.description}</p>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${crStatusStyles[cr.status]}`}
                      >
                        {cr.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-[#94A3B8] mb-1">
                      <span>
                        Cost impact:{" "}
                        <span className="text-[#F1F5F9] font-medium">
                          +${cr.additionalCost.toLocaleString()}
                        </span>
                      </span>
                      <span>
                        Time impact:{" "}
                        <span className="text-[#F1F5F9] font-medium">
                          +{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-[#94A3B8]/50">
                        {new Date(cr.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {cr.status === "Pending" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#475569]/50">
                        <button
                          onClick={() => handleChangeRequest(cr.id, "Approved")}
                          className="bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleChangeRequest(cr.id, "Declined")}
                          className="bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
