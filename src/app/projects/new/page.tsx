"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProject } from "@/lib/storage";
import { getProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [revisionLimit, setRevisionLimit] = useState("3");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverablesLink, setDeliverablesLink] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [defaultPaymentLink, setDefaultPaymentLink] = useState("");

  useEffect(() => {
    getProfile()
      .then((p) => { if (p.payment_link) setDefaultPaymentLink(p.payment_link); })
      .catch(() => {});
  }, []);

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

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Project name is required";
    if (!clientName.trim()) errors.clientName = "Client name is required";
    if (!clientEmail.trim()) errors.clientEmail = "Client email is required";
    if (!price.trim()) errors.price = "Contract value is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const filteredDeliverables = deliverables.filter((d) => d.trim() !== "");
    if (filteredDeliverables.length === 0) return;

    // Check for duplicate project name (skip if user already confirmed)
    if (!duplicateWarning) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from("projects")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", name.trim());
        if (existing && existing.length > 0) {
          setDuplicateWarning(true);
          return;
        }
      }
    }
    setDuplicateWarning(false);

    setSaving(true);
    const projectId = crypto.randomUUID();
    try {
      const projectPrice = parseFloat(price) || 0;
      const parsedRevisionLimit = Math.max(1, parseInt(revisionLimit) || 1);

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
        revisionLimit: parsedRevisionLimit,
        revisionsUsed: 0,
        price: projectPrice,
        status: "Pending Approval",
        changeRequests: [],
        createdAt: new Date().toISOString(),
        ...(deadline ? { deadline } : {}),
        ...(deliverablesLink.trim() ? { deliverablesLink: deliverablesLink.trim() } : {}),
        ...(paymentLink.trim() ? { paymentLink: paymentLink.trim() } : {}),
      });

      // Send email to client
      console.log("[new-project] Project saved, sending email...");
      const portalUrl = `https://tryscopeguard.com/portal/${projectId}`;
      const emailPayload = {
        clientName,
        clientEmail,
        projectName: name,
        deliverables: filteredDeliverables,
        revisionLimit: parsedRevisionLimit,
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

  const inputBase =
    "w-full bg-[#0A0A0A] rounded-lg px-4 py-3 text-white placeholder-[#94A3B8]/50 focus:outline-none focus:ring-1 transition-colors";
  const inputClass = (field?: string) =>
    `${inputBase} border ${field && fieldErrors[field] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-[#2A2A2A] focus:border-[#6366F1] focus:ring-[#6366F1]"}`;
  const labelClass = "block text-sm font-medium text-[#A3A3A3] mb-2";

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-[#34D399]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#34D399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Project Created</h1>
          <p className="text-[#A3A3A3] mb-2">
            <strong className="text-white">{name}</strong> has been saved and a scope review email has been sent to <strong className="text-white">{clientEmail}</strong>.
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
              className="bg-[#6366F1] hover:bg-[#5254CC] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
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
        <h1 className="text-2xl sm:text-3xl font-bold text-white">New Project</h1>
        <p className="text-[#A3A3A3] mt-1 text-sm sm:text-base">
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

      {duplicateWarning && (
        <div className="bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl px-5 py-4 mb-2">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <div>
              <p className="text-[#FBBF24] font-medium text-sm">You already have a project named &ldquo;{name.trim()}&rdquo;</p>
              <p className="text-[#FBBF24]/70 text-sm mt-0.5">Click &ldquo;Create Project&rdquo; again to confirm.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6 pb-24">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white border-b border-[#2A2A2A] pb-3">
            Project Details
          </h2>

          <div>
            <label className={labelClass}>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((p) => { const { name: _, ...rest } = p; return rest; }); }}
              placeholder="e.g. Brand Identity Redesign"
              className={inputClass("name")}
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setFieldErrors((p) => { const { clientName: _, ...rest } = p; return rest; }); }}
                placeholder="e.g. Acme Corp"
                className={inputClass("clientName")}
              />
              {fieldErrors.clientName && <p className="text-red-400 text-xs mt-1">{fieldErrors.clientName}</p>}
            </div>
            <div>
              <label className={labelClass}>Client Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => { setClientEmail(e.target.value); setFieldErrors((p) => { const { clientEmail: _, ...rest } = p; return rest; }); }}
                placeholder="client@example.com"
                className={inputClass("clientEmail")}
              />
              {fieldErrors.clientEmail && <p className="text-red-400 text-xs mt-1">{fieldErrors.clientEmail}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Revision Limit</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={revisionLimit}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setRevisionLimit(val);
                  }
                }}
                placeholder="3"
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass}>Total Contract Value ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => { setPrice(e.target.value); setFieldErrors((p) => { const { price: _, ...rest } = p; return rest; }); }}
                placeholder="5000"
                className={inputClass("price")}
              />
              {fieldErrors.price && <p className="text-red-400 text-xs mt-1">{fieldErrors.price}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputClass()}
            />
          </div>

          <div>
            <label className={labelClass}>Deliverables Link (optional)</label>
            <input
              type="url"
              value={deliverablesLink}
              onChange={(e) => setDeliverablesLink(e.target.value)}
              placeholder="e.g. Google Drive, Dropbox, or WeTransfer link"
              className={inputClass()}
            />
          </div>

          <div>
            <label className={labelClass}>Payment Link (optional)</label>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="e.g. PayPal, Revolut, or Stripe link"
              className={inputClass()}
            />
            {defaultPaymentLink && !paymentLink && (
              <button
                type="button"
                onClick={() => setPaymentLink(defaultPaymentLink)}
                className="mt-1.5 text-xs font-medium text-[#818CF8] hover:text-[#A5B4FC] transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Use my default
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
            <h2 className="text-lg font-semibold text-white">Deliverables</h2>
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
              <div className="flex items-center justify-center w-8 h-12 text-sm font-medium text-[#A3A3A3]/60">
                {index + 1}.
              </div>
              <input
                type="text"
                value={d}
                onChange={(e) => updateDeliverable(index, e.target.value)}
                placeholder="Describe the deliverable..."
                className={`${inputClass()} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeDeliverable(index)}
                disabled={deliverables.length === 1}
                className="text-[#A3A3A3] hover:text-[#F87171] disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-2"
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
          className="w-full bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating & Sending Email...
            </span>
          ) : "Create Project & Send to Client"}
        </button>
      </form>
    </div>
  );
}
