import { createClient } from "./supabase/client";
import { Project, ChangeRequest, Deliverable } from "./types";

function getSupabase() {
  return createClient();
}

interface DbProject {
  id: string;
  name: string;
  client_name: string;
  client_email: string;
  price: number;
  revision_limit: number;
  revisions_used: number;
  status: string;
  deadline: string | null;
  deliverables_link: string | null;
  payment_link: string | null;
  deliverables: Deliverable[];
  created_at: string;
  user_id?: string;
}

interface DbChangeRequest {
  id: string;
  project_id: string;
  description: string;
  additional_cost: number;
  time_impact_days: number;
  status: string;
  created_at: string;
  user_id?: string;
}

function normalizeCRStatus(raw: string): ChangeRequest["status"] {
  const lower = raw.toLowerCase();
  if (lower === "approved") return "Approved";
  if (lower === "declined") return "Declined";
  return "Pending";
}

function mapProject(row: DbProject, changeRequests: DbChangeRequest[]): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    clientEmail: row.client_email,
    price: Number(row.price),
    revisionLimit: row.revision_limit,
    revisionsUsed: row.revisions_used,
    status: row.status as Project["status"],
    deadline: row.deadline ?? undefined,
    deliverablesLink: row.deliverables_link ?? undefined,
    paymentLink: row.payment_link ?? undefined,
    deliverables: row.deliverables,
    createdAt: row.created_at,
    changeRequests: changeRequests.map((cr) => ({
      id: cr.id,
      projectId: cr.project_id,
      description: cr.description,
      additionalCost: Number(cr.additional_cost),
      timeImpactDays: cr.time_impact_days,
      status: normalizeCRStatus(cr.status),
      createdAt: cr.created_at,
    })),
  };
}

async function getUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = getSupabase();
  const userId = await getUserId();

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (pErr) {
    console.error("Failed to fetch projects:", pErr);
    throw new Error(pErr.message);
  }

  const projectIds = (projects || []).map((p: DbProject) => p.id);

  const { data: crs, error: crErr } = projectIds.length > 0
    ? await supabase
        .from("change_requests")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (crErr) {
    console.error("Failed to fetch change requests:", crErr);
    throw new Error(crErr.message);
  }

  const crsByProject: Record<string, DbChangeRequest[]> = {};
  for (const cr of crs || []) {
    if (!crsByProject[cr.project_id]) crsByProject[cr.project_id] = [];
    crsByProject[cr.project_id].push(cr);
  }

  return (projects || []).map((p: DbProject) => mapProject(p, crsByProject[p.id] || []));
}

export async function getProject(id: string): Promise<Project | undefined> {
  const supabase = getSupabase();

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (pErr || !project) {
    if (pErr) console.error("Failed to fetch project:", pErr);
    return undefined;
  }

  const { data: crs, error: crErr } = await supabase
    .from("change_requests")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (crErr) console.error("Failed to fetch change requests for project:", crErr);

  return mapProject(project as DbProject, ((crs || []) as DbChangeRequest[]));
}

export async function saveProject(project: Project): Promise<void> {
  const supabase = getSupabase();
  const userId = await getUserId();
  const { changeRequests, ...rest } = project;

  const { error: projectErr } = await supabase.from("projects").upsert({
    id: rest.id,
    name: rest.name,
    client_name: rest.clientName,
    client_email: rest.clientEmail,
    price: rest.price,
    revision_limit: rest.revisionLimit,
    revisions_used: rest.revisionsUsed,
    status: rest.status,
    deadline: rest.deadline || null,
    deliverables_link: rest.deliverablesLink || null,
    payment_link: rest.paymentLink || null,
    deliverables: rest.deliverables,
    created_at: rest.createdAt,
    user_id: userId,
  });

  if (projectErr) {
    console.error("Failed to save project:", projectErr);
    throw new Error(projectErr.message);
  }

  if (changeRequests.length > 0) {
    const { error: crErr } = await supabase.from("change_requests").upsert(
      changeRequests.map((cr) => ({
        id: cr.id,
        project_id: cr.projectId,
        description: cr.description,
        additional_cost: cr.additionalCost,
        time_impact_days: cr.timeImpactDays,
        status: cr.status,
        created_at: cr.createdAt,
        user_id: userId,
      }))
    );

    if (crErr) {
      console.error("Failed to save change requests:", crErr);
      throw new Error(crErr.message);
    }
  }
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete project:", error);
    throw new Error(error.message);
  }
}

/**
 * Public project fetch for the client portal — no auth required.
 * Uses a fresh client; RLS policy allows SELECT by project ID for anyone.
 */
export async function getProjectPublic(id: string): Promise<Project | undefined> {
  const supabase = getSupabase();

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (pErr || !project) {
    if (pErr) console.error("Failed to fetch public project:", pErr);
    return undefined;
  }

  const { data: crs, error: crErr } = await supabase
    .from("change_requests")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (crErr) console.error("Failed to fetch change requests for public project:", crErr);

  return mapProject(project as DbProject, ((crs || []) as DbChangeRequest[]));
}

/**
 * Public save for portal actions (approve/decline change requests).
 * Does not require auth — RLS policy allows UPDATE on specific conditions.
 */
export async function saveProjectPublic(project: Project): Promise<void> {
  const supabase = getSupabase();
  const { changeRequests, ...rest } = project;

  const { error: projectErr } = await supabase.from("projects").update({
    deadline: rest.deadline || null,
  }).eq("id", rest.id);

  if (projectErr) {
    console.error("Failed to update project (public):", projectErr);
    throw new Error(projectErr.message);
  }

  if (changeRequests.length > 0) {
    for (const cr of changeRequests) {
      const { error: crErr } = await supabase
        .from("change_requests")
        .update({ status: cr.status })
        .eq("id", cr.id);

      if (crErr) {
        console.error("Failed to update change request (public):", crErr);
        throw new Error(crErr.message);
      }
    }
  }
}
