import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

interface NotifyCRPayload {
  projectId: string;
  projectName: string;
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing Supabase keys" },
        { status: 500 }
      );
    }

    const body: NotifyCRPayload = await request.json();
    const { projectId, projectName, description, additionalCost, timeImpactDays } = body;

    // Use anon client to look up the project owner
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (!project?.user_id) {
      return NextResponse.json({ error: "Project owner not found" }, { status: 404 });
    }

    // Get the owner's email from user_profiles
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", project.user_id)
      .single();

    const freelancerEmail = profile?.email;

    console.log("[notify-cr] project.user_id:", project.user_id);
    console.log("[notify-cr] Sending to freelancer:", freelancerEmail);

    if (!freelancerEmail) {
      console.error("[notify-cr] No email found in user_profiles for user_id:", project.user_id);
      return NextResponse.json({ error: "Freelancer email not found" }, { status: 404 });
    }

    const resend = new Resend(apiKey);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#0F172A;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
      <span style="font-size:28px;">&#x1F6E1;&#xFE0F;</span>
      <h1 style="color:#F1F5F9;font-size:22px;font-weight:800;margin:8px 0 0;">New Change Request</h1>
    </div>
    <div style="background-color:#FFFFFF;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        A new change request has been submitted on <strong style="color:#1E293B;">${projectName}</strong>.
      </p>
      <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="color:#1E293B;font-size:14px;font-weight:600;margin:0 0 12px;">Request Details</p>
        <p style="color:#475569;font-size:14px;line-height:1.5;margin:0 0 16px;">${description}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748B;font-size:14px;">Cost Impact</td>
            <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">+$${additionalCost.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748B;font-size:14px;">Time Impact</td>
            <td style="padding:6px 0;color:#1E293B;font-size:14px;font-weight:600;text-align:right;">+${timeImpactDays} day${timeImpactDays === 1 ? "" : "s"}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="https://tryscopeguard.com/pending-approvals" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          Review Request &rarr;
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
      to: freelancerEmail,
      subject: `New change request on ${projectName}`,
      html,
    });

    if (error) {
      console.error("[notify-cr] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notify-cr] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
