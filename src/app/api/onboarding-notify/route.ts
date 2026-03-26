import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

interface OnboardingPayload {
  userId: string;
  userEmail?: string;
  workTypes: string[];
  clientCount: string;
  scopeCreepExp: string;
  howFound: string;
  mainGoal: string;
  notes?: string;
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

    const body: OnboardingPayload = await request.json();
    const { userId, userEmail, workTypes, clientCount, scopeCreepExp, howFound, mainGoal, notes } = body;

    const resend = new Resend(apiKey);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#07090F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <div style="background-color:#0F1322;border:1px solid rgba(99,102,241,0.2);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">&#x1F389;</div>
      <h1 style="color:#FFFFFF;font-size:20px;font-weight:600;margin:0 0 4px;">New ScopeGuard Signup!</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1.5px;">Onboarding Response</p>
    </div>

    <div style="background-color:#0B0E18;padding:28px 32px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;width:140px;">User Email</td>
          <td style="padding:10px 0;color:#FFFFFF;font-size:13px;">${(userEmail ?? "Unknown").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">User ID</td>
          <td style="padding:10px 0;color:rgba(255,255,255,0.6);font-size:13px;font-family:monospace;">${userId}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Work Types</td>
          <td style="padding:10px 0;color:#A5B4FC;font-size:13px;">${workTypes.join(", ") || "None selected"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Active Clients</td>
          <td style="padding:10px 0;color:#FFFFFF;font-size:13px;">${clientCount || "Not answered"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Scope Creep?</td>
          <td style="padding:10px 0;color:#FFFFFF;font-size:13px;">${scopeCreepExp || "Not answered"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">How Found</td>
          <td style="padding:10px 0;color:#FFFFFF;font-size:13px;">${howFound || "Not answered"}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Main Goal</td>
          <td style="padding:10px 0;color:#FFFFFF;font-size:13px;">${mainGoal || "Not answered"}</td>
        </tr>
        ${notes ? `<tr>
          <td style="padding:10px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Notes</td>
          <td style="padding:10px 0;color:rgba(255,255,255,0.6);font-size:13px;white-space:pre-wrap;">${notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        </tr>` : ""}
      </table>
    </div>

    <div style="background-color:#0F1322;border:1px solid rgba(99,102,241,0.15);border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">ScopeGuard Onboarding Notifications</p>
    </div>

  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "ScopeGuard <noreply@tryscopeguard.com>",
      to: "nadimbouchaaya@gmail.com",
      subject: "\uD83C\uDF89 New ScopeGuard signup!",
      html,
    });

    if (error) {
      console.error("[onboarding-notify] Resend error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding-notify] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
