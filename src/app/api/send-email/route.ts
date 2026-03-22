import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

interface EmailPayload {
  clientName: string;
  clientEmail: string;
  projectName: string;
  deliverables: string[];
  revisionLimit: number;
  price: number;
  deadline?: string;
  portalUrl: string;
}

export async function POST(request: NextRequest) {
  console.log("[send-email] API route hit");

  try {
    const apiKey = process.env.RESEND_API_KEY;
    console.log("[send-email] RESEND_API_KEY present:", !!apiKey);
    console.log("[send-email] RESEND_API_KEY length:", apiKey?.length ?? 0);

    if (!apiKey) {
      console.error("[send-email] RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Server misconfiguration: missing RESEND_API_KEY" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const body: EmailPayload = await request.json();
    console.log("[send-email] Payload received:", {
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      projectName: body.projectName,
      deliverableCount: body.deliverables?.length,
      hasDeadline: !!body.deadline,
      portalUrl: body.portalUrl,
    });

    const {
      clientName,
      clientEmail,
      projectName,
      deliverables,
      revisionLimit,
      price,
      deadline,
      portalUrl,
    } = body;

    const formattedDeadline = deadline
      ? new Date(deadline).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    const deliverablesHtml = deliverables
      .map(
        (d, i) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;color:#475569;font-size:14px;">${i + 1}.</td><td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B;font-size:14px;">${d}</td></tr>`
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background-color:#0F172A;border-radius:12px 12px 0 0;padding:32px 32px 28px;text-align:center;">
      <div style="margin-bottom:8px;">
        <span style="font-size:32px;line-height:1;">&#x1F6E1;&#xFE0F;</span>
      </div>
      <h1 style="color:#F1F5F9;font-size:26px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">ScopeGuard</h1>
      <p style="color:#94A3B8;font-size:13px;margin:0;text-transform:uppercase;letter-spacing:1.5px;">Project Scope Agreement</p>
    </div>

    <!-- Body -->
    <div style="background-color:#FFFFFF;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">

      <p style="color:#1E293B;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Hi ${clientName},
      </p>

      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Thank you for choosing to work together. I've prepared the project scope for <strong style="color:#1E293B;">${projectName}</strong> and everything is ready for your review.
      </p>

      <!-- Project Summary -->
      <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin:0 0 24px;">
        <h2 style="color:#0F172A;font-size:16px;margin:0 0 16px;border-bottom:1px solid #E2E8F0;padding-bottom:12px;">Project Summary</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748B;font-size:14px;">Project</td>
            <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748B;font-size:14px;">Investment</td>
            <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">$${price.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748B;font-size:14px;">Revision Rounds</td>
            <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">${revisionLimit} included</td>
          </tr>
          ${formattedDeadline ? `<tr><td style="padding:6px 0;color:#64748B;font-size:14px;">Estimated Delivery</td><td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">${formattedDeadline}</td></tr>` : ""}
        </table>
      </div>

      <!-- Deliverables -->
      <div style="margin:0 0 24px;">
        <h2 style="color:#0F172A;font-size:16px;margin:0 0 12px;">Agreed Deliverables</h2>
        <table style="width:100%;border-collapse:collapse;background-color:#F8FAFC;border-radius:8px;overflow:hidden;border:1px solid #E2E8F0;">
          ${deliverablesHtml}
        </table>
      </div>

      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Please review the full scope details in your client portal. You'll be able to track progress, review change requests, and access project files all in one place.
      </p>

      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 32px;">
        Any work outside the deliverables listed above will be handled through a formal change request process, ensuring full transparency on cost and timeline adjustments.
      </p>

      <!-- CTA Buttons -->
      <div style="text-align:center;margin:0 0 16px;">
        <a href="${portalUrl}/approve" style="display:inline-block;background-color:#34D399;color:#0F172A;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Confirm Your Scope
        </a>
      </div>

      <div style="text-align:center;margin:0 0 24px;">
        <a href="${portalUrl}" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
          View Full Portal
        </a>
      </div>

      <p style="color:#94A3B8;font-size:13px;text-align:center;margin:0;">
        Or copy this link: <a href="${portalUrl}/approve" style="color:#6366F1;text-decoration:underline;">${portalUrl}/approve</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color:#F1F5F9;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;border:1px solid #E2E8F0;border-top:none;">
      <p style="color:#94A3B8;font-size:12px;margin:0 0 4px;">
        This email was sent via ScopeGuard — scope creep protection for freelancers.
      </p>
      <p style="color:#94A3B8;font-size:12px;margin:0;">
        If you have questions, reply directly to this email.
      </p>
    </div>

  </div>
</body>
</html>`;

    console.log("[send-email] Calling resend.emails.send...");
    const { data, error } = await resend.emails.send({
      from: "ScopeGuard <noreply@tryscopeguard.com>",
      to: clientEmail,
      subject: `Your project scope is ready for review - ${projectName}`,
      html,
    });

    if (error) {
      console.error("[send-email] Resend API error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[send-email] Email sent successfully, id:", data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
