import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

interface BugReportPayload {
  description: string;
  pageUrl?: string;
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

    const body: BugReportPayload = await request.json();
    const { description, pageUrl } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Try to get user email from auth
    let userEmail = "Unknown";
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const authHeader = request.headers.get("authorization");
        const cookieHeader = request.headers.get("cookie");
        if (authHeader || cookieHeader) {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
              headers: {
                ...(authHeader ? { authorization: authHeader } : {}),
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
              },
            },
          });
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) userEmail = user.email;
        }
      }
    } catch {
      // Continue with "Unknown" email
    }

    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const resend = new Resend(apiKey);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#07090F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background-color:#0F1322;border:1px solid rgba(99,102,241,0.2);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">&#x1F41B;</div>
      <h1 style="color:#FFFFFF;font-size:20px;font-weight:600;margin:0 0 4px;">Bug Report</h1>
      <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;text-transform:uppercase;letter-spacing:1.5px;">ScopeGuard</p>
    </div>

    <!-- Body -->
    <div style="background-color:#0B0E18;padding:28px 32px;border-left:1px solid rgba(99,102,241,0.15);border-right:1px solid rgba(99,102,241,0.15);">

      <!-- Bug description -->
      <div style="background-color:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Description</p>
        <p style="color:#FFFFFF;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>

      <!-- Details -->
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;width:100px;">Page URL</td>
          <td style="padding:8px 0;color:#818CF8;font-size:13px;word-break:break-all;">${pageUrl ? `<a href="${pageUrl.replace(/"/g, "&quot;")}" style="color:#818CF8;text-decoration:underline;">${pageUrl.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</a>` : "Not provided"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Reported by</td>
          <td style="padding:8px 0;color:#FFFFFF;font-size:13px;">${userEmail.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;vertical-align:top;">Time</td>
          <td style="padding:8px 0;color:rgba(255,255,255,0.6);font-size:13px;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color:#0F1322;border:1px solid rgba(99,102,241,0.15);border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;">ScopeGuard Bug Reports</p>
    </div>

  </div>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: "ScopeGuard <noreply@tryscopeguard.com>",
      to: "nadimbouchaaya@gmail.com",
      subject: "\uD83D\uDC1B Bug Report \u2014 ScopeGuard",
      html,
    });

    if (error) {
      console.error("[report-bug] Resend API error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[report-bug] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send bug report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
