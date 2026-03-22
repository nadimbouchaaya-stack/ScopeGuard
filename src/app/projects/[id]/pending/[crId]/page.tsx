"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ChangeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const crId = params.crId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [acting, setActing] = useState(false);
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

  const handleCashRainComplete = useCallback(() => {
    setShowCashRain(false);
    router.push("/pending-approvals");
  }, [router]);

  async function handleAction(action: "Approved" | "Declined") {
    if (!project || acting) return;
    setActing(true);

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

    if (action === "Approved") {
      setShowCashRain(true);
    } else {
      router.push("/pending-approvals");
    }
  }

  if (!loaded) return null;

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Project not found</h2>
        <p className="text-[#94A3B8] mb-6">This project may have been deleted.</p>
        <Link href="/pending-approvals" className="text-[#818CF8] hover:text-[#A5B4FC] font-medium">
          Back to Pending Approvals
        </Link>
      </div>
    );
  }

  const cr = project.changeRequests.find((c) => c.id === crId);

  if (!cr) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Change request not found</h2>
        <p className="text-[#94A3B8] mb-6">This request may have been removed.</p>
        <Link href="/pending-approvals" className="text-[#818CF8] hover:text-[#A5B4FC] font-medium">
          Back to Pending Approvals
        </Link>
      </div>
    );
  }

  const isPending = cr.status === "Pending";

  return (
    <div className="max-w-2xl mx-auto">
      {showCashRain && <CashRain onComplete={handleCashRainComplete} emoji={cashRainEmoji} />}

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/pending-approvals"
          className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Pending Approvals
        </Link>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">Change Request Review</h1>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap ${
            isPending
              ? "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30"
              : cr.status === "Approved"
                ? "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30"
                : "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30"
          }`}>
            {isPending ? "Pending Review" : cr.status}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Project context card */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6">
          <h2 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Project Context</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#94A3B8] mb-0.5">Project</p>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm font-semibold text-[#818CF8] hover:text-[#A5B4FC] transition-colors"
              >
                {project.name}
              </Link>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-0.5">Client</p>
              <p className="text-sm font-medium text-[#F1F5F9]">{project.clientName}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-0.5">Contract Value</p>
              <p className="text-sm font-medium text-[#F1F5F9]">${project.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[#94A3B8] mb-0.5">Deadline</p>
              <p className="text-sm font-medium text-[#F1F5F9]">
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })
                  : "No deadline"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#94A3B8] mb-0.5">Revisions</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#F1F5F9]">
                  <span className={project.revisionsUsed >= project.revisionLimit ? "text-[#F87171]" : ""}>
                    {project.revisionsUsed}
                  </span>
                  <span className="text-[#94A3B8]/60">/{project.revisionLimit}</span>
                </span>
                <div className="flex-1 bg-[#475569]/50 rounded-full h-1.5 max-w-[120px]">
                  <div
                    className={`h-1.5 rounded-full ${
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
              </div>
            </div>
          </div>
        </div>

        {/* The Request card */}
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 border-l-[3px] border-l-[#FBBF24]">
          <h2 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-4">Change Request</h2>

          <p className="text-lg font-semibold text-[#F1F5F9] mb-5">{cr.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-[#0F172A] rounded-lg p-4">
              <p className="text-xs text-[#94A3B8] mb-1">Cost Impact</p>
              <p className="text-xl font-bold text-[#FBBF24]">+${cr.additionalCost.toLocaleString()}</p>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4">
              <p className="text-xs text-[#94A3B8] mb-1">Time Impact</p>
              <p className="text-xl font-bold text-[#FBBF24]">
                +{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}
              </p>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4">
              <p className="text-xs text-[#94A3B8] mb-1">Submitted</p>
              <p className="text-sm font-medium text-[#F1F5F9]">
                {new Date(cr.createdAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
          </div>

          {project.deadline && cr.timeImpactDays > 0 && (
            <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/20 rounded-lg px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-[#FBBF24] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-[#FBBF24]">
                Approving will extend the deadline by {cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"} to{" "}
                <span className="font-medium">
                  {(() => {
                    const d = new Date(project.deadline!);
                    d.setDate(d.getDate() + cr.timeImpactDays);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  })()}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Decision section */}
        {isPending && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleAction("Approved")}
              disabled={acting}
              className="w-full bg-[#34D399] hover:bg-[#2BC48E] disabled:opacity-50 text-[#0F172A] font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Approve Change Request
            </button>
            <button
              onClick={() => handleAction("Declined")}
              disabled={acting}
              className="w-full bg-transparent border border-[#F87171]/40 hover:bg-[#F87171]/10 disabled:opacity-50 text-[#F87171] font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Decline
            </button>
          </div>
        )}

        {!isPending && (
          <div className={`text-center py-6 rounded-xl border ${
            cr.status === "Approved"
              ? "bg-[#34D399]/10 border-[#34D399]/20"
              : "bg-[#F87171]/10 border-[#F87171]/20"
          }`}>
            <p className={`font-semibold ${
              cr.status === "Approved" ? "text-[#34D399]" : "text-[#F87171]"
            }`}>
              This change request has been {cr.status.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
