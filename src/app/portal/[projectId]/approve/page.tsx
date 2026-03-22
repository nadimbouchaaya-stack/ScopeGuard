"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Project } from "@/lib/types";
import { getProjectPublic, saveProjectPublic } from "@/lib/storage";

export default function ApproveScopePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [acted, setActed] = useState<"approved" | "changes" | null>(null);

  useEffect(() => {
    getProjectPublic(projectId).then((p) => {
      if (p) setProject(p);
      setLoaded(true);
    });
  }, [projectId]);

  async function handleApprove() {
    if (!project) return;
    const updated: Project = { ...project, status: "Active" };
    await saveProjectPublic(updated);
    setProject(updated);
    setActed("approved");
  }

  async function handleRequestChanges() {
    if (!project) return;
    const updated: Project = { ...project, status: "Pending Approval" };
    await saveProjectPublic(updated);
    setProject(updated);
    setActed("changes");
  }

  if (!loaded) return null;

  if (!project) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Project not found</h2>
        <p className="text-[#94A3B8]">This link may be invalid or the project may have been removed.</p>
      </div>
    );
  }

  if (acted === "approved") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-[#34D399]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Scope Approved!</h2>
        <p className="text-[#94A3B8] mb-6">
          You have approved the scope for <span className="text-[#F1F5F9] font-medium">{project.name}</span>.
          Your freelancer has been notified and work will begin shortly.
        </p>
        <a
          href={`/portal/${projectId}`}
          className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-medium px-6 py-3 rounded-xl transition-colors inline-block"
        >
          View Project Portal
        </a>
      </div>
    );
  }

  if (acted === "changes") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-[#FBBF24]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Changes Requested</h2>
        <p className="text-[#94A3B8] mb-6">
          Your feedback has been noted. The freelancer will review and update the scope for <span className="text-[#F1F5F9] font-medium">{project.name}</span>.
        </p>
        <a
          href={`/portal/${projectId}`}
          className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-medium px-6 py-3 rounded-xl transition-colors inline-block"
        >
          View Project Portal
        </a>
      </div>
    );
  }

  const formattedDeadline = project.deadline
    ? new Date(project.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="w-14 h-14 bg-[#6366F1]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] mb-2">Confirm Your Scope</h1>
        <p className="text-[#94A3B8] text-sm sm:text-base">
          Review the project details below and confirm the agreed scope.
        </p>
      </div>

      {/* Project details card */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4 border-b border-[#475569] pb-3">
          {project.name}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-[#0F172A] rounded-lg p-4">
            <p className="text-xs text-[#94A3B8] mb-1">Client</p>
            <p className="text-sm font-medium text-[#F1F5F9]">{project.clientName}</p>
          </div>
          <div className="bg-[#0F172A] rounded-lg p-4">
            <p className="text-xs text-[#94A3B8] mb-1">Contract Value</p>
            <p className="text-sm font-medium text-[#F1F5F9]">${project.price.toLocaleString()}</p>
          </div>
          <div className="bg-[#0F172A] rounded-lg p-4">
            <p className="text-xs text-[#94A3B8] mb-1">Revision Rounds</p>
            <p className="text-sm font-medium text-[#F1F5F9]">{project.revisionLimit} included</p>
          </div>
          {formattedDeadline && (
            <div className="bg-[#0F172A] rounded-lg p-4">
              <p className="text-xs text-[#94A3B8] mb-1">Deadline</p>
              <p className="text-sm font-medium text-[#F1F5F9]">{formattedDeadline}</p>
            </div>
          )}
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Agreed Deliverables</h2>
        <div className="space-y-2">
          {project.deliverables.map((d, i) => (
            <div
              key={d.id}
              className="flex items-start gap-3 bg-[#0F172A]/50 rounded-lg px-4 py-3"
            >
              <span className="text-[#94A3B8]/50 text-sm font-medium mt-0.5 shrink-0 w-6">
                {i + 1}.
              </span>
              <span className="text-sm text-[#F1F5F9]">{d.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#818CF8] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-sm text-[#94A3B8]">
          By approving, you confirm the deliverables and terms listed above. Any work outside this scope will go through a formal change request process with clear cost and timeline adjustments.
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={handleApprove}
          className="w-full bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Approve Scope
        </button>
        <button
          onClick={handleRequestChanges}
          className="w-full bg-transparent border border-[#FBBF24]/40 hover:bg-[#FBBF24]/10 text-[#FBBF24] font-semibold py-3.5 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Request Changes
        </button>
      </div>
    </div>
  );
}
