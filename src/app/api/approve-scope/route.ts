import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface ApproveScopePayload {
  projectId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: missing Supabase keys" },
        { status: 500 }
      );
    }

    const body: ApproveScopePayload = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify project exists and is in "Pending Approval" status
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("id, name, client_name, user_id, status")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status !== "Pending Approval") {
      return NextResponse.json(
        { error: "Project is not pending approval" },
        { status: 400 }
      );
    }

    // Update status to Active
    const { error: updateErr } = await supabase
      .from("projects")
      .update({ status: "Active" })
      .eq("id", projectId);

    if (updateErr) {
      console.error("[approve-scope] Update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Look up freelancer email from user_profiles
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("user_id", project.user_id)
      .single();

    // Send notification email to freelancer if we have their email
    if (profile?.email) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const { Resend } = await import("resend");
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
        <strong style="color:#1E293B;">${project.client_name}</strong> has reviewed and approved the project scope for <strong style="color:#1E293B;">${project.name}</strong>.
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

        await resend.emails.send({
          from: "ScopeGuard <noreply@tryscopeguard.com>",
          to: profile.email,
          subject: `${project.client_name} approved the project scope \u2014 ${project.name}`,
          html,
        }).catch((err: unknown) => {
          console.error("[approve-scope] Email send error:", err);
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[approve-scope] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to approve scope";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
