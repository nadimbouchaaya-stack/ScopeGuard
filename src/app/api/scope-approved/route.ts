import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";

interface ScopeApprovedPayload {
  projectId: string;
  projectName: string;
  clientName: string;
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

    const body: ScopeApprovedPayload = await request.json();
    const { projectId, projectName, clientName } = body;

    // Use anon client to look up the project owner's email from user_profiles
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (!project?.user_id) {
      return NextResponse.json({ error: "Project owner not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("user_id", project.user_id)
      .single();

    const freelancerEmail = profile?.email;

    if (!freelancerEmail) {
      return NextResponse.json({ error: "Freelancer email not found" }, { status: 404 });
    }

    const resend = new Resend(apiKey);
    const projectUrl = `https://tryscopeguard.com/projects/${projectId}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#0F172A;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
      <span style="font-size:28px;">&#x2705;</span>
      <h1 style="color:#F1F5F9;font-size:22px;font-weight:800;margin:8px 0 0;">Scope Approved!</h1>
    </div>
    <div style="background-color:#FFFFFF;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        <strong style="color:#1E293B;">${clientName}</strong> has reviewed and approved the project scope for <strong style="color:#1E293B;">${projectName}</strong>.
      </p>
      <div style="background-color:#D1FAE5;border:1px solid #A7F3D0;border-radius:8px;padding:16px 20px;margin:0 0 24px;text-align:center;">
        <p style="color:#065F46;font-size:14px;font-weight:600;margin:0;">
          The client has confirmed the deliverables and agreed to the terms. You&#39;re all set to begin work.
        </p>
      </div>
      <div style="text-align:center;">
        <a href="${projectUrl}" style="display:inline-block;background-color:#6366F1;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
          View Project &rarr;
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
      subject: `${clientName} approved the project scope \u2014 ${projectName}`,
      html,
    });

    if (error) {
      console.error("[scope-approved] Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[scope-approved] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
