"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORK_TYPES = [
  "Web Design", "Video Editing", "Graphic Design", "Development",
  "Photography", "Writing", "Illustration", "Other",
];
const CLIENT_COUNTS = ["Just starting", "1-3", "4-10", "10+"];
const SCOPE_CREEP_OPTIONS = ["All the time \uD83D\uDE24", "Sometimes", "Rarely", "Not yet"];
const HOW_FOUND = ["Reddit", "Twitter/X", "Google", "Friend", "ProductHunt", "IndieHackers", "Other"];
const MAIN_GOALS = [
  "Stop scope creep", "Look more professional",
  "Track projects", "Get paid faster", "All of the above",
];

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [clientCount, setClientCount] = useState("");
  const [scopeCreep, setScopeCreep] = useState("");
  const [howFound, setHowFound] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setWorkTypes([]);
      setClientCount("");
      setScopeCreep("");
      setHowFound("");
      setMainGoal("");
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleWorkType(t: string) {
    setWorkTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Save to Supabase
        await supabase.from("onboarding_responses").insert({
          user_id: user.id,
          work_types: workTypes,
          client_count: clientCount,
          scope_creep_experience: scopeCreep,
          how_found: howFound,
          main_goal: mainGoal,
          notes: notes || null,
        });

        // Notify via email (fire and forget)
        fetch("/api/onboarding-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            workTypes,
            clientCount,
            scopeCreepExp: scopeCreep,
            howFound,
            mainGoal,
            notes,
          }),
        }).catch(() => {});
      }
    } catch {
      // Continue even if save fails
    }

    localStorage.setItem("scopeguard_onboarding_done", "true");
    setSubmitting(false);
    onClose();
  }

  const chipBase = "px-4 py-2 rounded-full text-[12px] cursor-pointer transition-colors border";
  const chipInactive = "bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(99,102,241,0.15)]";
  const chipActive = "bg-[rgba(99,102,241,0.2)] border-[rgba(99,102,241,0.4)] text-[#A5B4FC]";

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.7)]" />
      <div
        className="relative mt-[10vh] w-full max-w-lg mx-4 bg-[#0F1322] border border-[rgba(99,102,241,0.2)] rounded-[20px] p-8 animate-fade-in"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-[8px] h-[8px] rounded-full ${step === 1 ? "bg-[#6366F1]" : "bg-[rgba(255,255,255,0.2)]"}`} />
          <div className={`w-[8px] h-[8px] rounded-full ${step === 2 ? "bg-[#6366F1]" : "bg-[rgba(255,255,255,0.2)]"}`} />
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-[22px] font-medium text-white">Welcome to ScopeGuard &#x1F6E1;&#xFE0F;</h2>
            <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">
              Quick questions to personalize your experience
            </p>

            {/* Q1: Work types */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              What type of freelance work do you do?
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {WORK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleWorkType(t)}
                  className={`${chipBase} ${workTypes.includes(t) ? chipActive : chipInactive}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Q2: Client count */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              How many active clients do you have right now?
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {CLIENT_COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setClientCount(c)}
                  className={`${chipBase} ${clientCount === c ? chipActive : chipInactive}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Q3: Scope creep */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              Have you experienced scope creep before?
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {SCOPE_CREEP_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setScopeCreep(o)}
                  className={`${chipBase} ${scopeCreep === o ? chipActive : chipInactive}`}
                >
                  {o}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full h-[44px] bg-[#6366F1] hover:bg-[#5558E6] rounded-[10px] text-white font-medium text-[14px] transition-colors"
            >
              Next →
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-medium text-white">Almost done! &#x1F389;</h2>
            <p className="text-[13px] text-[rgba(255,255,255,0.4)] mb-6">One last thing</p>

            {/* Q4: How found */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              How did you find ScopeGuard?
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {HOW_FOUND.map((h) => (
                <button
                  key={h}
                  onClick={() => setHowFound(h)}
                  className={`${chipBase} ${howFound === h ? chipActive : chipInactive}`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Q5: Main goal */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              What&apos;s your main goal with ScopeGuard?
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {MAIN_GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setMainGoal(g)}
                  className={`${chipBase} ${mainGoal === g ? chipActive : chipInactive}`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Q6: Notes */}
            <label className="text-[12px] text-[rgba(255,255,255,0.5)] font-medium block mb-2">
              Anything else you want us to know?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional — any feedback, feature requests, or how you've been handling scope creep..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-white p-3 text-[13px] resize-none focus:outline-none focus:border-[rgba(99,102,241,0.4)] placeholder-[rgba(255,255,255,0.25)] mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="h-[44px] px-5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[10px] text-[rgba(255,255,255,0.5)] text-[14px] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="flex-1 h-[44px] bg-[#6366F1] hover:bg-[#5558E6] rounded-[10px] text-white font-medium text-[14px] transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Let's go \uD83D\uDE80"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
