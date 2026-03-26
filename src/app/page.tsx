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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s ease-out both;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out both;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* ===== HERO ===== */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-28 text-center relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4">
          <span className="animate-scale-in inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 rounded-full px-4 py-1 text-sm mb-6">
            <ShieldIcon className="w-4 h-4" />
            Built for freelancers
          </span>

          <h1 className="animate-fade-up text-5xl sm:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            Stop Scope Creep
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Before It Kills Your Profits
            </span>
          </h1>

          <p className="animate-fade-up delay-100 text-lg sm:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one tool for freelancers to track projects, manage change requests, and protect your revenue.
          </p>

          <div className="animate-fade-up delay-200 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/25 text-base"
            >
              Get Started Free
            </Link>
            <a
              href="#how-it-works"
              className="border border-white/20 hover:bg-white/5 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 text-base"
            >
              See How It Works
            </a>
          </div>

          <p className="animate-fade-up delay-300 flex flex-wrap gap-x-6 gap-y-2 justify-center text-slate-400 text-sm mt-6">
            <span>&#10003; Free to start</span>
            <span>&#10003; No credit card required</span>
            <span>&#10003; Clients need no account</span>
            <span>&#10003; Setup in under 2 minutes</span>
          </p>

          {/* Mock browser window */}
          <div className="animate-fade-up delay-400 mt-12 mx-auto max-w-3xl rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 bg-slate-700/50 rounded text-slate-500 text-xs px-3 py-1 text-left">tryscopeguard.com/dashboard</div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-3">
              {["New Project", "Active Projects", "Deadlines"].map((label) => (
                <div key={label} className="bg-slate-700/50 rounded-lg p-4 text-slate-300 text-xs font-medium">{label}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST SIGNALS BAR ===== */}
      <div className="border-y border-white/10 bg-white/[0.03] py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-slate-300 text-sm px-4">
          <span className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-indigo-400" />
            Built for freelancers
          </span>
          <span className="flex items-center gap-2">&#10003; Clients need no account</span>
          <span className="flex items-center gap-2">&#10003; Free to start</span>
          <span className="flex items-center gap-2">&#10003; Setup in 2 minutes</span>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Three simple steps to protect every project you take on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] border-t border-dashed border-indigo-500/30" />

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
              <div key={item.step} className="text-center relative z-10">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
                    {item.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-7 h-7 bg-white text-[#0F172A] rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-20 px-4">
        <h2 className="text-3xl font-bold text-center text-white mb-4">
          Everything you need to protect your scope
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
          One tool. Every protection a freelancer needs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { icon: "\u{1F6E1}\u{FE0F}", title: "Scope Protection", desc: "Define deliverables and revision limits from day one. Everything documented." },
            { icon: "\u{1F4E7}", title: "Change Request Emails", desc: "Clients approve changes in 60 seconds via email. No account needed." },
            { icon: "\u{1F441}\u{FE0F}", title: "Client Portal", desc: "Shareable link where clients see deliverables, revisions, and progress." },
            { icon: "\u{1F4B0}", title: "Revenue Tracking", desc: "See exactly how much extra revenue you have recovered from scope changes." },
            { icon: "\u23F0", title: "Deadline Management", desc: "Track all project deadlines with urgency indicators in one place." },
            { icon: "\u{1F4CA}", title: "Approval Analytics", desc: "Know your approval rate and project health at a glance." },
          ].map((f) => (
            <div key={f.title} className="bg-slate-800/50 border border-white/5 rounded-xl p-6 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PAIN POINTS ===== */}
      <section className="py-20 px-4 bg-slate-800/30">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Sound familiar?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { quote: "\u201CClient asked for one small change\u2026 3 weeks later\u201D", body: "Without a documented scope, every request feels urgent and every boundary is negotiable." },
            { quote: "\u201CYou delivered everything. They expected more.\u201D", body: "Misaligned expectations cost freelancers thousands every year. A clear portal link fixes this from day one." },
            { quote: "\u201CAwkward money conversations kill great projects\u201D", body: "ScopeGuard gives you a professional paper trail so scope changes become normal business, not conflict." },
          ].map((item) => (
            <div key={item.quote} className="bg-slate-800/80 border-l-4 border-indigo-500 rounded-xl p-6">
              <p className="text-white font-medium italic mb-3">{item.quote}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border-t border-indigo-500/20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-black text-white mb-4">Ready to stop working for free?</h2>
          <p className="text-slate-300 mb-8">Join freelancers using ScopeGuard to protect their revenue and their time.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all"
            >
              Get Started Free &rarr;
            </Link>
            <a
              href="#how-it-works"
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/5 transition-all"
            >
              See How It Works
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-6">&#x1F512; Free plan available &middot; No credit card required</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-indigo-400" />
            <span className="text-white font-bold">ScopeGuard</span>
            <span className="text-slate-500 text-sm ml-2">Protecting freelancer revenue since 2025</span>
          </div>
          <div className="flex gap-6 text-slate-400 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-slate-600 text-xs">&copy; 2025 ScopeGuard. Made for freelancers.</p>
        </div>
      </footer>
    </div>
  );
}
