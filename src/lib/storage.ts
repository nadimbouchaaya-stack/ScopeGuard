import { supabase } from "./supabase";
import { Project, ChangeRequest, Deliverable } from "./types";

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
}

interface DbChangeRequest {
  id: string;
  project_id: string;
  description: string;
  additional_cost: number;
  time_impact_days: number;
  status: string;
  created_at: string;
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
      status: cr.status as ChangeRequest["status"],
      createdAt: cr.created_at,
    })),
  };
}

export async function getProjects(): Promise<Project[]> {
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (pErr || !projects) return [];

  const { data: crs } = await supabase
    .from("change_requests")
    .select("*")
    .order("created_at", { ascending: true });

  const crsByProject: Record<string, DbChangeRequest[]> = {};
  for (const cr of crs || []) {
    if (!crsByProject[cr.project_id]) crsByProject[cr.project_id] = [];
    crsByProject[cr.project_id].push(cr);
  }

  return projects.map((p: DbProject) => mapProject(p, crsByProject[p.id] || []));
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (pErr || !project) return undefined;

  const { data: crs } = await supabase
    .from("change_requests")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return mapProject(project as DbProject, (crs || []) as DbChangeRequest[]);
}

export async function saveProject(project: Project): Promise<void> {
  const { changeRequests, ...rest } = project;

  await supabase.from("projects").upsert({
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
  });

  // Upsert all change requests for this project
  if (changeRequests.length > 0) {
    await supabase.from("change_requests").upsert(
      changeRequests.map((cr) => ({
        id: cr.id,
        project_id: cr.projectId,
        description: cr.description,
        additional_cost: cr.additionalCost,
        time_impact_days: cr.timeImpactDays,
        status: cr.status,
        created_at: cr.createdAt,
      }))
    );
  }
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.from("projects").delete().eq("id", id);
}
