"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProjects } from "@/lib/storage";
import AppTopBar from "@/components/AppTopBar";

export default function ProjectHistory() {
  const [grouped, setGrouped] = useState<Record<string, Project[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProjects().then((all) => {
      const completed = all.filter((p) => p.status === "Completed");
      const groups: Record<string, Project[]> = {};
      for (const project of completed) {
        const key = project.clientName;
        if (!groups[key]) groups[key] = [];
        groups[key].push(project);
      }
      setGrouped(groups);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const clientNames = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-page, #07090F)" }}>
      <AppTopBar title="History" />
      <div className="p-5">

      {clientNames.length === 0 ? (
        <div className="text-center py-20 bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px]">
          <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-1">No completed projects yet</h3>
          <p className="text-[#94A3B8] mb-5">Projects will appear here once they are marked as completed.</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            View Active Projects
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {clientNames.map((clientName) => {
            const projects = grouped[clientName];
            const clientEmail = projects[0].clientEmail;

            return (
              <div key={clientName} className="bg-[#0F1322] border border-[rgba(255,255,255,0.06)] rounded-[14px] overflow-hidden">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="text-lg font-semibold text-[#F1F5F9]">{clientName}</h2>
                  <p className="text-[#94A3B8] text-sm mt-0.5">{clientEmail}</p>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {projects.map((project) => {
                    const totalCost =
                      project.price +
                      project.changeRequests
                        .filter((cr) => cr.status === "Approved")
                        .reduce((sum, cr) => sum + cr.additionalCost, 0);

                    return (
                      <div key={project.id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#F1F5F9] truncate">{project.name}</h3>
                          <p className="text-[#94A3B8]/60 text-sm mt-0.5">
                            Completed {new Date(project.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-[#F1F5F9]">${totalCost.toLocaleString()}</p>
                          <p className="text-[#94A3B8]/60 text-xs mt-0.5">Final price</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
