"use client";

import { useState, useEffect } from "react";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (isOpen) {
      setPageUrl(window.location.href);
      setDescription("");
      setStatus("idle");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), pageUrl }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" />
      <div
        className="relative mt-[20vh] w-full max-w-md mx-4 bg-[#0F1322] border border-[rgba(99,102,241,0.2)] rounded-[16px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[18px] font-medium text-white">Report a Bug</h2>
        <p className="text-[13px] text-[rgba(255,255,255,0.4)] mt-1 mb-4">
          Help us improve ScopeGuard
        </p>

        {status === "success" ? (
          <div className="flex items-center gap-2 py-6 justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-[14px] text-[#34D399] font-medium">
              Thanks! We&apos;ll look into it.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug..."
              required
              className="w-full min-h-[120px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-white p-3 text-[13px] resize-none focus:outline-none focus:border-[rgba(99,102,241,0.4)] placeholder-[rgba(255,255,255,0.25)]"
            />

            <input
              type="text"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              placeholder="Which page were you on?"
              className="w-full mt-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-white px-3 py-2 text-[13px] focus:outline-none focus:border-[rgba(99,102,241,0.4)] placeholder-[rgba(255,255,255,0.25)]"
            />

            {status === "error" && (
              <p className="text-[12px] text-[#EF4444] mt-2">
                Failed to send. Please try again.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-[34px] px-4 rounded-[9px] text-[12px] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !description.trim()}
                className="h-[34px] px-4 rounded-[9px] text-[12px] font-medium text-white bg-[#6366F1] hover:bg-[#5558E6] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
