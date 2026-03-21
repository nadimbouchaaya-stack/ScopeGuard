"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProjects } from "@/lib/storage";

function getDaysUntil(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineColor(days: number) {
  if (days < 0) return { dot: "bg-[#F87171]", text: "text-[#F87171]", bg: "bg-[#F87171]/10", label: "Overdue" };
  if (days <= 7) return { dot: "bg-[#FBBF24]", text: "text-[#FBBF24]", bg: "bg-[#FBBF24]/10", label: days === 0 ? "Due today" : `${days} day${days === 1 ? "" : "s"} left` };
  return { dot: "bg-[#34D399]", text: "text-[#34D399]", bg: "bg-[#34D399]/10", label: `${days} days left` };
}

export default function Deadlines() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProjects().then((all) => {
      const active = all
        .filter((p) => p.status !== "Completed" && p.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
      setProjects(active);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const weekRevenue = projects
    .filter((p) => {
      const days = getDaysUntil(p.deadline!);
      return days >= 0 && days <= 7;
    })
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F1F5F9]">Deadlines</h1>
        <p className="text-[#94A3B8] mt-1">
          Track upcoming deadlines across all active projects.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#475569] rounded-2xl">
          <div className="w-16 h-16 bg-[#334155] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F1F5F9] mb-1">No deadlines set</h3>
          <p className="text-[#94A3B8]">Add deadlines to your projects to track them here.</p>
        </div>
      ) : (
        <>
          {/* Revenue Summary */}
          <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-8 mb-8 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              {/* Outer dark ring */}
              <svg className="w-40 h-40" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * 0.25}`}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  className="opacity-30"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#34D399]">
                  +${weekRevenue.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[#94A3B8] text-sm font-medium">Expected this week</p>
          </div>

          {/* Project list */}
          <div className="space-y-3">
            {projects.map((project) => {
              const days = getDaysUntil(project.deadline!);
              const color = getDeadlineColor(days);
              const dueDate = new Date(project.deadline!).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={project.id}
                  className="bg-[#1E293B] border border-[#475569] rounded-xl p-5 flex items-center gap-4 hover:bg-[#334155] transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${color.dot} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-[#F1F5F9] truncate">{project.name}</h3>
                      <span className="text-[#94A3B8] text-sm shrink-0">{project.clientName}</span>
                    </div>
                    <p className="text-[#94A3B8]/60 text-sm">{dueDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-medium ${color.text} ${color.bg} px-3 py-1 rounded-full`}>
                      {color.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
