"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ===== NAVIGATION ===== */}
      <nav
        className="sticky top-0 z-50 h-[56px] flex items-center"
        style={{
          backgroundColor: "rgba(10,10,10,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #1E1E1E",
        }}
      >
        <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#6366F1] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-white font-medium text-[15px]">ScopeGuard</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-[#A3A3A3] hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] text-[#A3A3A3] hover:text-white transition-colors">How it works</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-[#A3A3A3] hover:text-white transition-colors hidden sm:block">Log in</Link>
            <Link href="/signup" className="text-[13px] font-medium text-white bg-[#6366F1] hover:bg-[#5254CC] px-4 py-2 rounded-[8px] transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        className="min-h-[80vh] flex items-center justify-center relative overflow-hidden"
        style={{ padding: "80px 24px" }}
      >
        {/* Radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 60%)" }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="text-center max-w-4xl mx-auto relative z-10">
          {/* Announcement pill */}
          <div className="animate-fade-in inline-flex items-center gap-2 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" style={{ animation: "pulse-dot 2s infinite" }} />
            <span className="text-[12px] text-[#A5B4FC]">Free for freelancers &middot; No credit card required</span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "white",
              animationDelay: "0.1s",
            }}
          >
            Stop Scope Creep
            <br />
            Before It{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Costs
            </span>
            {" "}You
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-up text-[18px] text-[#A3A3A3] max-w-2xl mx-auto mt-6"
            style={{ lineHeight: 1.6, animationDelay: "0.2s" }}
          >
            The professional client portal that locks your deliverables,
            tracks revisions, and turns every scope change into a
            formal (paid) request.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-up flex gap-4 justify-center flex-wrap mt-10" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#5254CC] text-white font-medium text-[15px] px-6 py-3 rounded-[10px] transition-all"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}
            >
              Start free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#111111] text-white font-medium text-[15px] px-6 py-3 rounded-[10px] transition-all"
            >
              See how it works
            </a>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up flex flex-wrap gap-x-8 gap-y-2 justify-center text-[#525252] text-[13px] mt-8" style={{ animationDelay: "0.4s" }}>
            {["Free to start", "No credit card", "Clients need no account", "Setup in 2 minutes"].map((text) => (
              <span key={text} className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 scroll-mt-20" style={{ borderTop: "1px solid #1E1E1E" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium text-[#6366F1] uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-[32px] font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
              Three steps to protect every project
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px bg-[#2A2A2A]" />

            {[
              {
                num: "01",
                title: "Define your scope",
                desc: "Create a project with deliverables, budget, revision limit, and deadline. Everything documented from day one.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                num: "02",
                title: "Share with your client",
                desc: "Send a portal link where clients review the scope, see deliverables, and approve or request changes. No account needed.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                ),
              },
              {
                num: "03",
                title: "Track every change",
                desc: "When clients want extra work, it becomes a formal change request with cost and time impact. Full transparency, zero awkwardness.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.num} className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#111111] border border-[#2A2A2A] mb-5 mx-auto">
                  <span className="text-[#6366F1]">{step.icon}</span>
                </div>
                <p className="text-[11px] font-medium text-[#525252] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-mono)" }}>{step.num}</p>
                <h3 className="text-[16px] font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[14px] text-[#A3A3A3] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24" style={{ borderTop: "1px solid #1E1E1E" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium text-[#6366F1] uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-[32px] font-semibold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
              Everything you need to protect your scope
            </h2>
            <p className="text-[16px] text-[#A3A3A3] max-w-xl mx-auto">
              One tool. Every protection a freelancer needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Scope Protection",
                desc: "Define deliverables and revision limits from day one. Everything documented and locked.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: "Change Request Emails",
                desc: "Clients approve changes in 60 seconds via email. No account needed.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ),
              },
              {
                title: "Client Portal",
                desc: "Shareable link where clients see deliverables, revisions, and project progress.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                ),
              },
              {
                title: "Revenue Tracking",
                desc: "See exactly how much extra revenue you recovered from scope changes.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: "Deadline Management",
                desc: "Track all project deadlines with urgency indicators in one place.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                ),
              },
              {
                title: "Approval Analytics",
                desc: "Know your approval rate and project health at a glance.",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-[#111111] border border-[#2A2A2A] rounded-[12px] p-6 hover:border-[rgba(99,102,241,0.3)] transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(99,102,241,0.1)] flex items-center justify-center mb-4 group-hover:bg-[rgba(99,102,241,0.15)] transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#A3A3A3] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAIN POINTS ===== */}
      <section className="py-24" style={{ borderTop: "1px solid #1E1E1E" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[32px] font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>
              Sound familiar?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                quote: "\u201CClient asked for one small change\u2026 3 weeks later\u201D",
                body: "Without a documented scope, every request feels urgent and every boundary is negotiable.",
              },
              {
                quote: "\u201CYou delivered everything. They expected more.\u201D",
                body: "Misaligned expectations cost freelancers thousands every year. A clear portal link fixes this from day one.",
              },
              {
                quote: "\u201CAwkward money conversations kill great projects\u201D",
                body: "ScopeGuard gives you a professional paper trail so scope changes become normal business, not conflict.",
              },
            ].map((item) => (
              <div
                key={item.quote}
                className="bg-[#111111] border border-[#2A2A2A] rounded-[12px] p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#6366F1]" />
                <p className="text-white font-medium italic mb-3 text-[15px]">{item.quote}</p>
                <p className="text-[14px] text-[#A3A3A3] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: "1px solid #1E1E1E" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(99,102,241,0.08) 0%, transparent 60%)" }}
        />
        <div className="text-center max-w-2xl mx-auto px-6 relative z-10">
          <h2 className="text-[36px] font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            Ready to stop working for free?
          </h2>
          <p className="text-[16px] text-[#A3A3A3] mb-10">
            Join freelancers using ScopeGuard to protect their revenue and their time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5254CC] text-white font-medium text-[15px] px-7 py-3.5 rounded-[10px] transition-all"
              style={{ boxShadow: "0 0 20px rgba(99,102,241,0.25)" }}
            >
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center border border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#111111] text-white font-medium text-[15px] px-7 py-3.5 rounded-[10px] transition-all"
            >
              See How It Works
            </a>
          </div>
          <p className="text-[#3A3A3A] text-[13px] mt-6">Free plan available &middot; No credit card required</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid #1E1E1E" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6366F1] rounded-md flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-white font-medium text-[14px]">ScopeGuard</span>
          </div>
          <div className="flex flex-wrap gap-6 text-[13px] text-[#525252]">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[#3A3A3A] text-[12px]">&copy; 2025 ScopeGuard</p>
        </div>
      </footer>
    </div>
  );
}
