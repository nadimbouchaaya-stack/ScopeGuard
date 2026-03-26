"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Project } from "@/lib/types";
import { useRouter } from "next/navigation";
import { getProject, saveProject, deleteProject } from "@/lib/storage";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editRevisionLimit, setEditRevisionLimit] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editDeliverables, setEditDeliverables] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const router = useRouter();

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
      revisionsUsed: action === "Approved" ? project.revisionsUsed + 1 : project.revisionsUsed,
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

  async function handleToggleDeliverable(index: number) {
    if (!project) return;
    const updated: Project = {
      ...project,
      deliverables: project.deliverables.map((d, i) =>
        i === index ? { ...d, completed: !d.completed } : d
      ),
    };
    setProject(updated);
    await saveProject(updated);
  }

  async function handleMarkComplete() {
    if (!project || completing) return;
    setCompleting(true);
    try {
      const updated: Project = { ...project, status: "Completed" };
      await saveProject(updated);
      router.push("/history");
    } catch (err) {
      console.error("Failed to mark complete:", err);
      setCompleting(false);
      setShowCompleteConfirm(false);
    }
  }

  function openEditModal() {
    if (!project) return;
    setEditName(project.name);
    setEditPrice(String(project.price));
    setEditRevisionLimit(String(project.revisionLimit));
    setEditDeadline(project.deadline || "");
    setEditDeliverables(project.deliverables.map((d) => d.description));
    setShowEditModal(true);
  }

  async function handleEditSave() {
    if (!project || editSaving) return;
    setEditSaving(true);
    try {
      const updated: Project = {
        ...project,
        name: editName.trim() || project.name,
        price: parseFloat(editPrice) || project.price,
        revisionLimit: Math.max(1, parseInt(editRevisionLimit) || project.revisionLimit),
        deadline: editDeadline || undefined,
        deliverables: editDeliverables
          .filter((d) => d.trim())
          .map((d, i) => ({
            id: project.deliverables[i]?.id || crypto.randomUUID(),
            description: d,
            completed: project.deliverables[i]?.completed || false,
          })),
      };
      await saveProject(updated);
      setProject(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to save edits:", err);
    }
    setEditSaving(false);
  }

  async function handleDelete() {
    if (!project || deleting) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      router.push("/projects");
    } catch (err) {
      console.error("Failed to delete project:", err);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

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
    .filter((cr) => cr.status?.toLowerCase().trim() === "approved")
    .reduce((sum, cr) => sum + cr.additionalCost, 0);

  const totalApprovedDays = project.changeRequests
    .filter((cr) => cr.status?.toLowerCase().trim() === "approved")
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
              {project.clientName}
            </p>
            <p className="text-[#94A3B8]/50 text-xs mt-0.5">
              {project.clientEmail}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            {project.status !== "Completed" && (
              <button
                onClick={openEditModal}
                className="bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit
              </button>
            )}
            {project.status !== "Completed" && (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                className="bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mark Complete
              </button>
            )}
            {project.deadline && (
              <button
                onClick={() => {
                  const d = new Date(project.deadline!);
                  const startDate = d.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 8);
                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(project.name + " \u2014 Deadline")}&dates=${startDate}/${startDate}&details=${encodeURIComponent("Client: " + project.clientName + "\nProject value: $" + project.price + "\nPortal: https://tryscopeguard.com/portal/" + project.id)}&location=${encodeURIComponent("ScopeGuard")}`;
                  window.open(url, "_blank");
                }}
                className="bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] text-[#34D399] text-[12px] h-[32px] px-3 rounded-[8px] transition-colors hover:bg-[rgba(52,211,153,0.15)] flex items-center gap-1.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                Add to Calendar
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://tryscopeguard.com/portal/${project.id}`);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.124a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.25" />
              </svg>
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
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
                  <button
                    key={d.id}
                    onClick={() => handleToggleDeliverable(i)}
                    className="flex items-center gap-3 bg-[#0F172A]/50 rounded-lg px-4 py-3 w-full text-left hover:bg-[#0F172A]/70 transition-colors group/del"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      d.completed
                        ? "bg-[#34D399] border-[#34D399]"
                        : "border-[#475569] group-hover/del:border-[#94A3B8]"
                    }`}>
                      {d.completed && (
                        <svg className="w-3 h-3 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${d.completed ? "text-[#94A3B8] line-through" : "text-[#F1F5F9]"}`}>
                      {d.description}
                    </span>
                  </button>
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

                    {cr.status?.toLowerCase().trim() === "pending" && (
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

        {/* Delete Project */}
        <div className="pt-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm font-medium text-[#F87171] hover:text-[#FCA5A5] transition-colors border border-[#F87171]/30 hover:border-[#F87171]/50 px-4 py-2.5 rounded-xl hover:bg-[#F87171]/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete Project
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
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
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-[#F87171] hover:bg-[#EF4444] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Complete confirmation modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCompleteConfirm(false)}>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-[#34D399]/15 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#F1F5F9] text-center mb-2">Mark as Complete</h3>
            <p className="text-sm text-[#94A3B8] text-center mb-6">
              Mark this project as complete? It will move to Project History.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="flex-1 bg-[#34D399] hover:bg-[#2BC48E] disabled:opacity-50 text-[#0F172A] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {completing ? "Completing..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#F1F5F9] mb-5">Edit Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Contract Value ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Revision Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={editRevisionLimit}
                    onChange={(e) => setEditRevisionLimit(e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#94A3B8]">Deliverables</label>
                  <button
                    type="button"
                    onClick={() => setEditDeliverables([...editDeliverables, ""])}
                    className="text-xs font-medium text-[#818CF8] hover:text-[#A5B4FC] transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {editDeliverables.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={d}
                        onChange={(e) => {
                          const updated = [...editDeliverables];
                          updated[i] = e.target.value;
                          setEditDeliverables(updated);
                        }}
                        placeholder="Deliverable description..."
                        className="flex-1 bg-[#0F172A] border border-[#475569] rounded-lg px-3 py-2 text-[#F1F5F9] focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                      />
                      {editDeliverables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditDeliverables(editDeliverables.filter((_, j) => j !== i))}
                          className="text-[#94A3B8] hover:text-[#F87171] transition-colors p-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#94A3B8]/60">Client name and email cannot be edited to preserve portal links.</p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-50 text-[#F1F5F9] font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
