"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { getProjects } from "@/lib/storage";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProjects().then((p) => {
      setProjects(p);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const activeCount = projects.filter(
    (p) => p.status === "Active" || p.status === "Pending Approval"
  ).length;
  const completedCount = projects.filter(
    (p) => p.status === "Completed"
  ).length;

  const now = new Date();
  const upcomingDeadlines = projects.filter((p) => {
    if (p.status === "Completed" || !p.deadline) return false;
    const diff = Math.ceil(
      (new Date(p.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff <= 7;
  }).length;

  const cards = [
    {
      title: "New Project",
      description: "Create a new project and define your scope",
      href: "/projects/new",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
      color: "indigo",
      badge: null,
    },
    {
      title: "Active Projects",
      description: "Manage your ongoing projects and track scope",
      href: "/projects",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      ),
      color: "green",
      badge: activeCount > 0 ? `${activeCount} active` : null,
    },
    {
      title: "Project History",
      description: "View completed projects grouped by client",
      href: "/history",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "slate",
      badge: completedCount > 0 ? `${completedCount} completed` : null,
    },
    {
      title: "Deadlines",
      description: "Track upcoming deadlines across all projects",
      href: "/deadlines",
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: "amber",
      badge: upcomingDeadlines > 0 ? `${upcomingDeadlines} due soon` : null,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string; badgeBg: string; badgeText: string }> = {
    indigo: {
      bg: "bg-[#6366F1]/10",
      border: "border-[#6366F1]/20 hover:border-[#6366F1]/40",
      icon: "text-[#6366F1]",
      hover: "group-hover:text-[#818CF8]",
      badgeBg: "bg-[#6366F1]/15",
      badgeText: "text-[#818CF8]",
    },
    green: {
      bg: "bg-[#34D399]/10",
      border: "border-[#34D399]/20 hover:border-[#34D399]/40",
      icon: "text-[#34D399]",
      hover: "group-hover:text-[#6EE7B7]",
      badgeBg: "bg-[#34D399]/15",
      badgeText: "text-[#34D399]",
    },
    slate: {
      bg: "bg-[#94A3B8]/10",
      border: "border-[#94A3B8]/20 hover:border-[#94A3B8]/40",
      icon: "text-[#94A3B8]",
      hover: "group-hover:text-[#CBD5E1]",
      badgeBg: "bg-[#94A3B8]/15",
      badgeText: "text-[#94A3B8]",
    },
    amber: {
      bg: "bg-[#FBBF24]/10",
      border: "border-[#FBBF24]/20 hover:border-[#FBBF24]/40",
      icon: "text-[#FBBF24]",
      hover: "group-hover:text-[#FCD34D]",
      badgeBg: "bg-[#FBBF24]/15",
      badgeText: "text-[#FBBF24]",
    },
  };

  return (
    <div>
      <div className="text-center mb-8 sm:mb-12 pt-2 sm:pt-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] mb-2">Welcome to ScopeGuard</h1>
        <p className="text-[#94A3B8] text-sm sm:text-base">
          Protect your freelance projects from scope creep.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
        {cards.map((card) => {
          const colors = colorMap[card.color];
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`group relative bg-[#1E293B] border ${colors.border} rounded-xl p-5 sm:p-8 transition-all hover:bg-[#334155] hover:scale-[1.02] hover:shadow-lg`}
            >
              {card.badge && (
                <span className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full ${colors.badgeBg} ${colors.badgeText}`}>
                  {card.badge}
                </span>
              )}
              <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-5 ${colors.icon}`}>
                {card.icon}
              </div>
              <h2 className={`text-xl font-semibold text-[#F1F5F9] mb-2 ${colors.hover} transition-colors`}>
                {card.title}
              </h2>
              <p className="text-[#94A3B8] text-sm">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
