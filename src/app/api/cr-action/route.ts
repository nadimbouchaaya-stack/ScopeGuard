import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

interface CRActionPayload {
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  action: "Approved" | "Declined";
  description: string;
  additionalCost: number;
  timeImpactDays: number;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const body: CRActionPayload = await request.json();
    const {
      projectId,
      projectName,
      clientName,
      clientEmail,
      action,
      description,
      additionalCost,
      timeImpactDays,
    } = body;

    if (!clientEmail) {
      return NextResponse.json({ error: "No client email" }, { status: 400 });
    }

    const resend = new Resend(apiKey);
    const portalUrl = `https://tryscopeguard.com/portal/${projectId}`;
    const isApproved = action === "Approved";

    const subject = isApproved
      ? `Your change request has been approved \u2014 ${projectName}`
      : `Update on your change request \u2014 ${projectName}`;

    const statusBadge = isApproved
      ? `<span style="display:inline-block;background-color:#D1FAE5;color:#065F46;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;">Approved</span>`
      : `<span style="display:inline-block;background-color:#FEE2E2;color:#991B1B;font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;">Declined</span>`;

    const bodyMessage = isApproved
      ? `Great news! Your change request for <strong style="color:#1E293B;">${projectName}</strong> has been approved by the freelancer.`
      : `Your change request for <strong style="color:#1E293B;">${projectName}</strong> has been reviewed but cannot be accommodated at this time.`;

    const impactRows = [];
    if (isApproved && additionalCost > 0) {
      impactRows.push(`
        <tr>
          <td style="padding:6px 0;color:#64748B;font-size:14px;">Additional Cost</td>
          <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">+$${additionalCost.toLocaleString()}</td>
        </tr>`);
    }
    if (isApproved && timeImpactDays > 0) {
      impactRows.push(`
        <tr>
          <td style="padding:6px 0;color:#64748B;font-size:14px;">Timeline Extension</td>
          <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">+${timeImpactDays} day${timeImpactDays === 1 ? "" : "s"}</td>
        </tr>`);
    }

    const impactSection = impactRows.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;">${impactRows.join("")}</table>`
      : "";

    const footerNote = isApproved
      ? "The updated scope and timeline are reflected in your project portal."
      : "If you have questions, please reach out to your freelancer directly.";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#0F172A;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
      <span style="font-size:28px;">&#x1F6E1;&#xFE0F;</span>
      <h1 style="color:#F1F5F9;font-size:22px;font-weight:800;margin:8px 0 0;">Change Request Update</h1>
    </div>
    <div style="background-color:#FFFFFF;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
      <p style="color:#1E293B;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Hi ${clientName},
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        ${bodyMessage}
      </p>
      <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin:0 0 24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <p style="color:#1E293B;font-size:14px;font-weight:600;margin:0;">Your Request</p>
          ${statusBadge}
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.5;margin:0;">${description}</p>
        ${impactSection}
      </div>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
        ${footerNote}
      </p>
      <div style="text-align:center;">
        <a href="${portalUrl}" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          View Project Portal &rarr;
        </a>
      </div>
    </div>
    <div style="background-color:#F1F5F9;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border:1px solid #E2E8F0;border-top:none;">
      <p style="color:#94A3B8;font-size:12px;margin:0;">Sent via ScopeGuard &middot; tryscopeguard.com</p>
    </div>
  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "ScopeGuard <noreply@tryscopeguard.com>",
      to: clientEmail,
      subject,
      html,
    });

    if (error) {
      console.error("[cr-action] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[cr-action] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
