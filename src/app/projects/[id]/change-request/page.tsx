"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";

export default function ChangeRequestPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [description, setDescription] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");
  const [timeImpactDays, setTimeImpactDays] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setProject(p);
      setLoaded(true);
    });
  }, [projectId]);

  if (!loaded) return null;

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">
          Project not found
        </h2>
        <p className="text-[#A3A3A3] mb-6">
          This project may have been deleted.
        </p>
        <Link
          href="/dashboard"
          className="text-[#818CF8] hover:text-[#A5B4FC] font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const atLimit = project.revisionsUsed >= project.revisionLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!project || atLimit) return;

    const updatedProject: Project = {
      ...project,
      revisionsUsed: project.revisionsUsed + 1,
      status:
        project.revisionsUsed + 1 >= project.revisionLimit
          ? "Pending Approval"
          : project.status,
      changeRequests: [
        ...project.changeRequests,
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          description,
          additionalCost: parseFloat(additionalCost) || 0,
          timeImpactDays: parseInt(timeImpactDays) || 0,
          status: "Pending",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    await saveProject(updatedProject);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-[#34D399]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-[#34D399]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Change Request Sent
        </h2>
        <p className="text-[#A3A3A3] mb-8">
          The change request has been sent to{" "}
          <span className="text-white font-medium">{project.clientName}</span>{" "}
          at {project.clientEmail}. They can review it in the client portal.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href={`/portal/${project.id}`}
            className="bg-[#6366F1] hover:bg-[#5254CC] text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            View Client Portal
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors";
  const labelClass = "block text-sm font-medium text-[#A3A3A3] mb-2";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-1 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Change Request</h1>
        <p className="text-[#A3A3A3] mt-1">
          For{" "}
          <span className="text-white font-medium">{project.name}</span> —{" "}
          {project.clientName}
        </p>
      </div>

      {atLimit ? (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl p-6 text-center">
          <div className="w-14 h-14 bg-[#F87171]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#F87171]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F87171] mb-2">Revision Limit Reached</h2>
          <p className="text-[#F87171]/70 mb-2">
            This project has used all {project.revisionLimit} of its allowed revisions ({project.revisionsUsed}/{project.revisionLimit}).
          </p>
          <p className="text-[#F87171]/50 text-sm mb-6">
            No further change requests can be submitted for this project.
          </p>
          <div className="w-full bg-[#475569]/50 rounded-full h-2 mb-6 max-w-xs mx-auto">
            <div className="h-2 rounded-full bg-[#F87171] w-full" />
          </div>
          <Link
            href="/dashboard"
            className="bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white font-medium px-5 py-2.5 rounded-lg transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[#FBBF24] mt-0.5 shrink-0"
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
            <div className="text-sm">
              <p className="text-[#FBBF24] font-medium">
                Revisions used: {project.revisionsUsed}/{project.revisionLimit}
              </p>
              <p className="text-[#FBBF24]/70 mt-0.5">
                Submitting this will count as an additional revision. The client will
                be notified to approve or decline.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white border-b border-[#2A2A2A] pb-3">
                Request Details
              </h2>

              <div>
                <label className={labelClass}>Description of Extra Work</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the additional work the client is requesting..."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Additional Cost ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={additionalCost}
                    onChange={(e) => setAdditionalCost(e.target.value)}
                    placeholder="500"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Deadline Extension (days)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={timeImpactDays}
                    onChange={(e) => setTimeImpactDays(e.target.value)}
                    placeholder="e.g. 3"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-[#6366F1] hover:bg-[#5254CC] text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
            >
              Send Change Request
            </button>
          </form>
        </>
      )}
    </div>
  );
}
