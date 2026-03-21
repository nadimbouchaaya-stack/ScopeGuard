"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProject } from "@/lib/storage";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [revisionLimit, setRevisionLimit] = useState(3);
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverablesLink, setDeliverablesLink] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function addDeliverable() {
    setDeliverables([...deliverables, ""]);
  }

  function updateDeliverable(index: number, value: string) {
    const updated = [...deliverables];
    updated[index] = value;
    setDeliverables(updated);
  }

  function removeDeliverable(index: number) {
    if (deliverables.length === 1) return;
    setDeliverables(deliverables.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filteredDeliverables = deliverables.filter((d) => d.trim() !== "");
    if (filteredDeliverables.length === 0) return;

    setSaving(true);
    const projectId = crypto.randomUUID();
    try {
      const projectPrice = parseFloat(price) || 0;

      await saveProject({
        id: projectId,
        name,
        clientName,
        clientEmail,
        deliverables: filteredDeliverables.map((d) => ({
          id: crypto.randomUUID(),
          description: d,
          completed: false,
        })),
        revisionLimit,
        revisionsUsed: 0,
        price: projectPrice,
        status: "Active",
        changeRequests: [],
        createdAt: new Date().toISOString(),
        ...(deadline ? { deadline } : {}),
        ...(deliverablesLink.trim() ? { deliverablesLink: deliverablesLink.trim() } : {}),
        ...(paymentLink.trim() ? { paymentLink: paymentLink.trim() } : {}),
      });

      // Send email to client
      console.log("[new-project] Project saved, sending email...");
      const portalUrl = `https://scope-guard-fawn.vercel.app/portal/${projectId}`;
      const emailPayload = {
        clientName,
        clientEmail,
        projectName: name,
        deliverables: filteredDeliverables,
        revisionLimit,
        price: projectPrice,
        deadline: deadline || undefined,
        portalUrl,
      };
      console.log("[new-project] Email payload:", emailPayload);

      const emailRes = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload),
      });

      console.log("[new-project] Email API response status:", emailRes.status);
      const emailData = await emailRes.json();
      console.log("[new-project] Email API response body:", emailData);

      if (!emailRes.ok) {
        // Project saved successfully but email failed — still show success with warning
        setSuccess(true);
        setError(`Project created but email failed to send: ${emailData.error || "Unknown error"}`);
        setSaving(false);
        return;
      }

      setSuccess(true);
      setSaving(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save project";
      console.log("Save project error:", err);
      setError(message);
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-[#0F172A] border border-[#475569] rounded-lg px-4 py-3 text-[#F1F5F9] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors";
  const labelClass = "block text-sm font-medium text-[#94A3B8] mb-2";

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-[#34D399]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] mb-2">Project Created</h1>
          <p className="text-[#94A3B8] mb-2">
            <strong className="text-[#F1F5F9]">{name}</strong> has been saved and a scope review email has been sent to <strong className="text-[#F1F5F9]">{clientEmail}</strong>.
          </p>

          {error && (
            <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-lg px-4 py-3 mb-6 mt-4 text-left">
              <p className="text-[#FBBF24] text-sm font-medium">Warning</p>
              <p className="text-[#FBBF24]/70 text-sm mt-0.5">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              View Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9]">New Project</h1>
        <p className="text-[#94A3B8] mt-1 text-sm sm:text-base">
          Define your project scope and protect it from day one.
        </p>
      </div>

      {error && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl px-5 py-4 mb-2 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-[#F87171] font-medium text-sm">Failed to create project</p>
            <p className="text-[#F87171]/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#F1F5F9] border-b border-[#475569] pb-3">
            Project Details
          </h2>

          <div>
            <label className={labelClass}>Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brand Identity Redesign"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Revision Limit</label>
              <input
                type="number"
                required
                min={1}
                value={revisionLimit}
                onChange={(e) => setRevisionLimit(parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Project Price ($)</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Deliverables Link (optional)</label>
            <input
              type="url"
              value={deliverablesLink}
              onChange={(e) => setDeliverablesLink(e.target.value)}
              placeholder="e.g. Google Drive, Dropbox, or WeTransfer link"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Payment Link (optional)</label>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="e.g. PayPal, Revolut, or Stripe link"
              className={inputClass}
            />
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#475569] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#475569] pb-3">
            <h2 className="text-lg font-semibold text-[#F1F5F9]">Deliverables</h2>
            <button
              type="button"
              onClick={addDeliverable}
              className="text-sm font-medium text-[#818CF8] hover:text-[#A5B4FC] transition-colors flex items-center gap-1"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Item
            </button>
          </div>

          {deliverables.map((d, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex items-center justify-center w-8 h-12 text-sm font-medium text-[#94A3B8]/60">
                {index + 1}.
              </div>
              <input
                type="text"
                value={d}
                onChange={(e) => updateDeliverable(index, e.target.value)}
                placeholder="Describe the deliverable..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeDeliverable(index)}
                disabled={deliverables.length === 1}
                className="text-[#94A3B8] hover:text-[#F87171] disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-50 disabled:cursor-not-allowed text-[#F1F5F9] font-semibold py-3.5 rounded-xl transition-colors text-base"
        >
          {saving ? "Creating & Sending Email..." : "Create Project & Send to Client"}
        </button>
      </form>
    </div>
  );
}
