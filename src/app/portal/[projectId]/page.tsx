"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Project, ChangeRequest } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";

const statusColors: Record<string, string> = {
  Active: "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30",
  "Pending Approval": "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30",
  Completed: "bg-[#94A3B8]/15 text-[#94A3B8] border-[#94A3B8]/30",
};

const crStatusColors: Record<string, string> = {
  Pending: "bg-[#FBBF24]/15 text-[#FBBF24]",
  Approved: "bg-[#34D399]/15 text-[#34D399]",
  Declined: "bg-[#F87171]/15 text-[#F87171]",
};

export default function ClientPortal() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setProject(p);
      setLoaded(true);
    });
  }, [projectId]);

  async function handleChangeRequest(crId: string, action: "Approved" | "Declined") {
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

  const pendingRequests = project.changeRequests.filter(
    (cr) => cr.status === "Pending"
  );
  const resolvedRequests = project.changeRequests.filter(
    (cr) => cr.status !== "Pending"
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">{project.name}</h1>
            <p className="text-[#94A3B8] mt-1">Client: {project.clientName}</p>
            <p className="text-[#94A3B8]/70 text-sm mt-0.5">{project.clientEmail}</p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColors[project.status]}`}
          >
            {project.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#475569]">
          <div>
            <p className="text-xs text-[#94A3B8]/60 uppercase tracking-wider mb-1">
              Project Price
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

      {/* Pending Change Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-[#1E293B] border border-[#FBBF24]/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-[#FBBF24]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-[#FBBF24]">
              Pending Change Requests
            </h2>
          </div>

          <div className="space-y-4">
            {pendingRequests.map((cr) => (
              <ChangeRequestCard
                key={cr.id}
                cr={cr}
                onAction={handleChangeRequest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Change Requests */}
      {resolvedRequests.length > 0 && (
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">
            Past Change Requests
          </h2>
          <div className="space-y-3">
            {resolvedRequests.map((cr) => (
              <div
                key={cr.id}
                className="py-3 px-4 rounded-lg bg-[#0F172A]/50 flex items-start justify-between"
              >
                <div>
                  <p className="text-[#F1F5F9] text-sm">{cr.description}</p>
                  <p className="text-[#94A3B8]/60 text-xs mt-1">
                    +${cr.additionalCost.toLocaleString()} · +{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${crStatusColors[cr.status]}`}
                >
                  {cr.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.changeRequests.length === 0 && (
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 text-center">
          <p className="text-[#94A3B8]">
            No change requests have been submitted for this project.
          </p>
        </div>
      )}
    </div>
  );
}

function ChangeRequestCard({
  cr,
  onAction,
}: {
  cr: ChangeRequest;
  onAction: (id: string, action: "Approved" | "Declined") => void;
}) {
  return (
    <div className="bg-[#0F172A]/50 rounded-lg p-4">
      <p className="text-[#F1F5F9] font-medium mb-2">{cr.description}</p>
      <div className="flex gap-4 text-sm text-[#94A3B8] mb-4">
        <span>
          Additional cost:{" "}
          <span className="text-[#F1F5F9] font-medium">
            +${cr.additionalCost.toLocaleString()}
          </span>
        </span>
        <span>
          Deadline extension:{" "}
          <span className="text-[#F1F5F9] font-medium">+{cr.timeImpactDays} day{cr.timeImpactDays === 1 ? "" : "s"}</span>
        </span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onAction(cr.id, "Approved")}
          className="bg-[#34D399] hover:bg-[#2BC48E] text-[#0F172A] font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => onAction(cr.id, "Declined")}
          className="bg-[#334155] hover:bg-[#475569] text-[#94A3B8] hover:text-[#F1F5F9] font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
