"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Project } from "@/lib/types";
import { getProjectPublic } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

const statusColors: Record<string, string> = {
  Active: "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30",
  "Pending Approval": "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30",
  Completed: "bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30",
};

export default function ClientPortal() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);

  // CR submission form state
  const [showCRForm, setShowCRForm] = useState(false);
  const [crDescription, setCrDescription] = useState("");
  const [crCost, setCrCost] = useState("");
  const [crDays, setCrDays] = useState("");
  const [crSubmitting, setCrSubmitting] = useState(false);
  const [crError, setCrError] = useState<string | null>(null);
  const [crSuccess, setCrSuccess] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  function loadProject() {
    getProjectPublic(projectId).then((p) => {
      if (p) setProject(p);
      setLoaded(true);
    });
  }

  async function handleSubmitCR(e: React.FormEvent) {
    e.preventDefault();
    if (!crDescription.trim()) return;

    setCrSubmitting(true);
    setCrError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("change_requests")
      .insert({
        project_id: projectId,
        description: crDescription.trim(),
        additional_cost: Number(crCost) || 0,
        time_impact_days: Number(crDays) || 0,
        status: "Pending",
      });

    setCrSubmitting(false);

    if (error) {
      console.error("[Portal] CR insert error:", error);
      setCrError("Failed to submit request. Please try again.");
      return;
    }

    setCrSuccess(true);
    setCrDescription("");
    setCrCost("");
    setCrDays("");
    setShowCRForm(false);

    // Reload project to show the new CR
    loadProject();
  }

  if (!loaded) return null;

  if (!project) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-[#94A3B8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">
          Project not found
        </h2>
        <p className="text-[#94A3B8]">
          This link may be invalid or the project may have been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9]">{project.name}</h1>
            <p className="text-[#94A3B8] mt-1">Client: {project.clientName}</p>
            <p className="text-[#94A3B8]/70 text-sm mt-0.5">{project.clientEmail}</p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColors[project.status]}`}
          >
            {project.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#475569]">
          <div>
            <p className="text-xs text-[#94A3B8]/60 uppercase tracking-wider mb-1">
              Total Contract Value
            </p>
            <p className="text-lg font-semibold text-[#F1F5F9]">
              ${project.price.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]/60 uppercase tracking-wider mb-1">
              Revisions Remaining
            </p>
            <p className="text-lg font-semibold">
              <span
                className={
                  project.revisionLimit - project.revisionsUsed <= 0
                    ? "text-[#F87171]"
                    : project.revisionLimit - project.revisionsUsed <= project.revisionLimit / 2
                      ? "text-[#FBBF24]"
                      : "text-[#34D399]"
                }
              >
                {Math.max(0, project.revisionLimit - project.revisionsUsed)}
              </span>
              <span className="text-[#94A3B8] text-sm font-normal">
                {" "}
                of {project.revisionLimit}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8]/60 uppercase tracking-wider mb-1">
              Deliverables
            </p>
            <p className="text-lg font-semibold text-[#F1F5F9]">
              {project.deliverables.length} items
            </p>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Agreed Scope & Deliverables</h2>
        <div className="space-y-3">
          {project.deliverables.map((deliverable, index) => (
            <div
              key={deliverable.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[#0F172A]/50"
            >
              <div className="w-6 h-6 rounded-full border-2 border-[#475569] flex items-center justify-center text-xs text-[#94A3B8] shrink-0">
                {index + 1}
              </div>
              <span className="text-[#F1F5F9]">{deliverable.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables Link */}
      {project.deliverablesLink && (
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-3">Project Files</h2>
          <a
            href={project.deliverablesLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#818CF8] hover:text-[#A5B4FC] font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.044a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.81" />
            </svg>
            Open Deliverables
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      )}

      {/* Payment */}
      {project.paymentLink && (
        <div className="bg-[#1E293B] border border-[#34D399]/30 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-3">Payment</h2>
          <a
            href={project.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-semibold py-3 rounded-lg transition-colors text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Pay Now
          </a>
        </div>
      )}

      {/* CR Success Banner */}
      {crSuccess && (
        <div className="bg-[#34D399]/10 border border-[#34D399]/30 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#34D399] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-[#34D399]">Change request submitted!</p>
            <p className="text-xs text-[#94A3B8] mt-1">The freelancer will review it shortly.</p>
          </div>
          <button onClick={() => setCrSuccess(false)} className="ml-auto text-[#94A3B8] hover:text-[#F1F5F9]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Submit Change Request */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
        {project.revisionsUsed >= project.revisionLimit ? (
          <div className="text-center py-2">
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-[#475569] text-[#94A3B8] font-semibold py-3 rounded-xl cursor-not-allowed text-base opacity-60"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Request a Change
            </button>
            <p className="text-xs text-[#F87171] mt-3">
              You&apos;ve used all {project.revisionLimit} revision{project.revisionLimit === 1 ? "" : "s"} included in this project. Please contact the freelancer directly for additional changes.
            </p>
          </div>
        ) : !showCRForm ? (
          <button
            onClick={() => setShowCRForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold py-3 rounded-xl transition-colors text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Request a Change
          </button>
        ) : (
          <form onSubmit={handleSubmitCR}>
            <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Submit Change Request</h2>

            {crError && (
              <div className="mb-4 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 text-sm text-[#F87171]">
                {crError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                  What do you need changed?
                </label>
                <textarea
                  value={crDescription}
                  onChange={(e) => setCrDescription(e.target.value)}
                  placeholder="Describe the change you'd like..."
                  rows={3}
                  required
                  className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                    Estimated cost impact ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={crCost}
                    onChange={(e) => setCrCost(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                    Estimated time impact (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={crDays}
                    onChange={(e) => setCrDays(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="submit"
                disabled={crSubmitting || !crDescription.trim()}
                className="flex-1 bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-50 text-[#F1F5F9] font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {crSubmitting ? "Submitting..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCRForm(false); setCrError(null); }}
                className="bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-5 py-3 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Requests */}
      {project.changeRequests.length > 0 ? (
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-1">Your Change Requests</h2>
          <p className="text-xs text-[#94A3B8] mb-4">Requests you&apos;ve submitted for this project</p>
          <div className="space-y-3">
            {project.changeRequests.map((cr) => (
              <div
                key={cr.id}
                className="bg-[#0F172A]/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-[#F1F5F9] text-sm font-medium">{cr.description}</p>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                      cr.status?.toLowerCase().trim() === "pending"
                        ? "bg-[#FBBF24]/15 text-[#FBBF24]"
                        : cr.status?.toLowerCase().trim() === "approved"
                          ? "bg-[#34D399]/15 text-[#34D399]"
                          : "bg-[#F87171]/15 text-[#F87171]"
                    }`}
                  >
                    {cr.status?.toLowerCase().trim() === "pending" ? "Pending Review" : cr.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                    +${cr.additionalCost.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                    +{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 text-center">
          <p className="text-[#94A3B8]">
            No change requests have been submitted for this project.
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#94A3B8]/50">
          Looking for another project? Check the email with your portal link.
        </p>
      </div>
    </div>
  );
}
