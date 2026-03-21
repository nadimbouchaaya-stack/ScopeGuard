"use client";

import Link from "next/link";

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s ease-out both;
        }
        .animate-fade-in {
          animation: fadeIn 0.7s ease-out both;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out both;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
      `}</style>

      {/* ===== HERO ===== */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-28 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#6366F1]/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4">
          <div className="animate-scale-in inline-flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-full px-4 py-1.5 mb-8">
            <ShieldIcon className="w-4 h-4 text-[#6366F1]" />
            <span className="text-sm text-[#818CF8] font-medium">Built for freelancers</span>
          </div>

          <h1 className="animate-fade-up text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#F1F5F9] leading-tight tracking-tight mb-6">
            Stop Scope Creep Before
            <br />
            <span className="text-[#6366F1]">It Kills Your Profits</span>
          </h1>

          <p className="animate-fade-up delay-100 text-lg sm:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one tool for freelancers to track projects, manage change requests, and protect your revenue.
          </p>

          <div className="animate-fade-up delay-200 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#6366F1]/25 text-base"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="bg-[#1E293B] border border-[#475569] hover:bg-[#334155] text-[#F1F5F9] font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 text-base"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mb-4">Sound familiar?</h2>
            <p className="text-[#94A3B8] text-lg max-w-xl mx-auto">
              Every freelancer has been there. These problems cost you time, money, and sanity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                ),
                title: '"Just one more thing..."',
                description: "Clients keep adding requests that weren't in the original scope. Each one is small, but together they double your workload.",
                color: "#FBBF24",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                ),
                title: "Projects go over budget",
                description: "You quoted for 10 hours but delivered 25. Without tracking, extra work eats into your profit margin silently.",
                color: "#F87171",
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: "Awkward money talks",
                description: "Telling a client \"that's extra\" feels confrontational. You end up doing free work to avoid the uncomfortable conversation.",
                color: "#94A3B8",
              },
            ].map((pain, i) => (
              <div
                key={pain.title}
                className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 sm:p-8 hover:bg-[#334155] transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${pain.color}15`, color: pain.color }}
                >
                  {pain.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">{pain.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{pain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-16 sm:py-24 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mb-4">How it works</h2>
            <p className="text-[#94A3B8] text-lg max-w-xl mx-auto">
              Three simple steps to protect every project you take on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Define your scope",
                description: "Create a project with deliverables, budget, revision limit, and deadline. Everything is documented from day one.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Share with your client",
                description: "Send clients a portal link where they can review the scope, see deliverables, and approve or decline change requests.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Track every change",
                description: "When the client wants extra work, log it as a change request with cost and time impact. Full transparency, zero awkwardness.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-2xl flex items-center justify-center text-[#6366F1] mx-auto">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#6366F1] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">{item.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9] mb-4">Everything you need</h2>
            <p className="text-[#94A3B8] text-lg max-w-xl mx-auto">
              Purpose-built features to protect your freelance business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Project Tracking",
                description: "Track deliverables, budgets, and revision counts in one place.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                ),
                color: "#34D399",
              },
              {
                title: "Change Request Workflow",
                description: "Log extra work with cost and time impact. Clients approve or decline.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                ),
                color: "#6366F1",
              },
              {
                title: "Client Portal",
                description: "Clients review scope and approve changes — no login required.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                ),
                color: "#818CF8",
              },
              {
                title: "Deadline Management",
                description: "Track deadlines across all projects. Change requests auto-extend dates.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
                color: "#FBBF24",
              },
              {
                title: "Revenue Protection",
                description: "Enforce revision limits and track additional costs from scope changes.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                color: "#F87171",
              },
              {
                title: "Email Notifications",
                description: "Auto-send professional scope emails to clients when you create a project.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ),
                color: "#34D399",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 hover:bg-[#334155] hover:border-[#6366F1]/30 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-[#F1F5F9] mb-1.5">{feature.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-b from-[#1E293B] to-[#1E293B]/50 border border-[#475569] rounded-2xl p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[#6366F1]/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 bg-[#6366F1]/15 border border-[#6366F1]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldIcon className="w-7 h-7 text-[#6366F1]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] mb-4">
                Ready to protect your projects?
              </h2>
              <p className="text-[#94A3B8] text-lg mb-8 max-w-lg mx-auto">
                Join freelancers who use ScopeGuard to keep projects on track and profits protected.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-10 py-3.5 rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#6366F1]/25 text-base"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#475569] py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6366F1] rounded-md flex items-center justify-center">
              <ShieldIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#94A3B8]">ScopeGuard</span>
          </div>
          <p className="text-xs text-[#94A3B8]/60">
            Scope creep protection for freelancers.
          </p>
        </div>
      </footer>
    </div>
  );
}
