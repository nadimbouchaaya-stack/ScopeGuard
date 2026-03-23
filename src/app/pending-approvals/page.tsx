"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChangeRequest } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
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

interface DbCR {
  id: string;
  project_id: string;
  description: string;
  additional_cost: number;
  time_impact_days: number;
  status: string;
  created_at: string;
}

interface DbProject {
  id: string;
  name: string;
  client_name: string;
  client_email: string;
  price: number;
  deadline: string | null;
  revision_limit: number;
}

interface CRWithProject {
  cr: ChangeRequest;
  project: DbProject;
}

export default function PendingApprovalsPage() {
  const [allCRItems, setAllCRItems] = useState<CRWithProject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCashRain, setShowCashRain] = useState(false);
  const [cashRainEmoji, setCashRainEmoji] = useState("💵");

  const [userProjectIds, setUserProjectIds] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<DbProject[]>([]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoaded(true);
      return;
    }

    const { data: projects, error: pErr } = await supabase
      .from("projects")
      .select("id, name, client_name, client_email, price, deadline, revision_limit")
      .eq("user_id", user.id);

    if (pErr) {
      console.error("[PendingApprovals] projects error:", pErr);
      setError(pErr.message);
      setLoaded(true);
      return;
    }

    const pIds = projects?.map((p: DbProject) => p.id) ?? [];
    setUserProjectIds(pIds);
    setUserProjects(projects ?? []);

    if (pIds.length === 0) {
      setAllCRItems([]);
      setLoaded(true);
      return;
    }

    const { data: allCRs, error: crErr } = await supabase
      .from("change_requests")
      .select("id, description, additional_cost, time_impact_days, status, created_at, project_id")
      .in("project_id", pIds)
      .order("created_at", { ascending: false });

    if (crErr) {
      console.error("[PendingApprovals] CRs error:", crErr);
      setError(crErr.message);
      setLoaded(true);
      return;
    }

    const items: CRWithProject[] = (allCRs ?? []).map((dbCr: DbCR) => ({
      cr: {
        id: dbCr.id,
        projectId: dbCr.project_id,
        description: dbCr.description,
        additionalCost: Number(dbCr.additional_cost),
        timeImpactDays: dbCr.time_impact_days,
        status: (dbCr.status || "Pending") as ChangeRequest["status"],
        createdAt: dbCr.created_at,
      },
      project: projects!.find((p: DbProject) => p.id === dbCr.project_id)!,
    }));

    setAllCRItems(items);
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchData();
    getProfile()
      .then((p) => setCashRainEmoji(p.cash_rain_emoji))
      .catch(() => {});
  }, [fetchData]);

  // Real-time subscription for CR changes
  useEffect(() => {
    if (userProjectIds.length === 0) return;
    const supabase = createClient();
    const channel = supabase
      .channel("pending-approvals-cr-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "change_requests" },
        () => fetchData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProjectIds, fetchData]);

  async function handleAction(projectId: string, crId: string, action: "Approved" | "Declined") {
    const item = allCRItems.find((x) => x.cr.id === crId);
    if (!item) return;

    const supabase = createClient();

    // Update the CR status directly
    const { error: crErr } = await supabase
      .from("change_requests")
      .update({ status: action })
      .eq("id", crId);

    if (crErr) {
      console.error("[PendingApprovals] update CR error:", crErr);
      return;
    }

    // If approved, increment revisions_used and extend deadline if needed
    if (action === "Approved") {
      // Fetch current revisions_used to increment
      const { data: proj } = await supabase
        .from("projects")
        .select("revisions_used, deadline")
        .eq("id", projectId)
        .single();

      const currentUsed = proj?.revisions_used ?? 0;
      const updateFields: Record<string, unknown> = {
        revisions_used: currentUsed + 1,
      };

      const deadline = proj?.deadline ?? item.project.deadline;
      if (item.cr.timeImpactDays > 0 && deadline) {
        const current = new Date(deadline);
        current.setDate(current.getDate() + item.cr.timeImpactDays);
        updateFields.deadline = current.toISOString().split("T")[0];
      }

      await supabase
        .from("projects")
        .update(updateFields)
        .eq("id", projectId);
    }

    // Update local state
    setAllCRItems((prev) =>
      prev.map((x) =>
        x.cr.id === crId ? { ...x, cr: { ...x.cr, status: action } } : x
      )
    );

    if (action === "Approved") {
      setShowCashRain(true);
    }
  }

  const handleCashRainComplete = useCallback(() => setShowCashRain(false), []);

  if (!loaded) return null;

  const pendingCRs = allCRItems.filter((x) => x.cr.status?.toLowerCase().trim() === "pending");
  const approvedCount = allCRItems.filter((x) => x.cr.status?.toLowerCase().trim() === "approved").length;
  const declinedCount = allCRItems.filter((x) => x.cr.status?.toLowerCase().trim() === "declined").length;
  const decidedCount = approvedCount + declinedCount;
  const approvalRate = decidedCount > 0 ? Math.round((approvedCount / decidedCount) * 100) : -1;

  const rateColor =
    approvalRate < 0
      ? { stroke: "#94A3B8", text: "text-[#94A3B8]" }
      : approvalRate < 50
        ? { stroke: "#F87171", text: "text-[#F87171]" }
        : approvalRate < 80
          ? { stroke: "#FBBF24", text: "text-[#FBBF24]" }
          : { stroke: "#34D399", text: "text-[#34D399]" };

  const circumference = 2 * Math.PI * 28;
  const donutOffset = approvalRate >= 0 ? circumference * (1 - approvalRate / 100) : circumference;

  return (
    <div>
      {showCashRain && <CashRain onComplete={handleCashRainComplete} emoji={cashRainEmoji} />}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">Pending Approvals</h1>
        <p className="text-[#94A3B8] mt-1 text-sm sm:text-base">
          Review and respond to incoming requests
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl px-5 py-4 text-sm text-[#F87171]">
          <strong>Error loading projects:</strong> {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{pendingCRs.length}</p>
            <p className="text-xs text-[#94A3B8]">Total Pending</p>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={rateColor.stroke} strokeWidth="5"
                strokeDasharray={circumference} strokeDashoffset={donutOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${rateColor.text}`}>
              {approvalRate >= 0 ? `${approvalRate}%` : "—"}
            </span>
          </div>
          <div>
            <p className={`text-2xl font-bold ${rateColor.text}`}>
              {approvalRate >= 0 ? `${approvalRate}%` : "N/A"}
            </p>
            <p className="text-xs text-[#94A3B8]">Approval Rate</p>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#34D399]/10 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{approvedCount}</p>
            <p className="text-xs text-[#94A3B8]">Total Approved</p>
          </div>
        </div>
      </div>

      {/* Section A — Pending Change Requests */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#FBBF24]/15 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[18px] h-[18px] text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Change Requests</h2>
        </div>

        {pendingCRs.length === 0 ? (
          <div className="text-center py-16 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl">
            <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#F1F5F9] font-semibold text-lg mb-1">You&apos;re all caught up!</p>
            <p className="text-[#94A3B8] text-sm">No pending approvals 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCRs.map(({ cr, project }) => (
              <div
                key={cr.id}
                className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 hover:bg-[#334155]/50 transition-colors"
              >
                {/* Header row: project info + date */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-semibold text-[#818CF8] hover:text-[#A5B4FC] transition-colors truncate"
                    >
                      {project.name}
                    </Link>
                    <span className="text-[#94A3B8]/40 text-xs shrink-0">&middot;</span>
                    <span className="text-[#94A3B8] text-xs shrink-0">{project.client_name}</span>
                  </div>
                  <span className="text-xs text-[#94A3B8]/50 shrink-0">
                    {new Date(cr.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[#F1F5F9] text-sm mb-4">{cr.description}</p>

                {/* Impact badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    +${cr.additionalCost.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    +{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#475569]">
                  <button
                    onClick={() => handleAction(project.id, cr.id, "Approved")}
                    className="bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(project.id, cr.id, "Declined")}
                    className="bg-[#F87171]/15 hover:bg-[#F87171]/25 text-[#F87171] font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Decline
                  </button>
                  <Link
                    href={`/projects/${project.id}/pending/${cr.id}`}
                    className="ml-auto bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section B — Project Scope Reviews (placeholder) */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#6366F1]/15 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[18px] h-[18px] text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Project Scope Reviews</h2>
        </div>

        <div className="text-center py-10 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl">
          <div className="w-14 h-14 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-[#94A3B8] text-sm">No project scope reviews pending</p>
        </div>
      </div>
    </div>
  );
}
