export type ProjectStatus = "Active" | "Pending Approval" | "Completed";

export interface Deliverable {
  id: string;
  description: string;
  completed: boolean;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  description: string;
  additionalCost: number;
  timeImpactDays: number;
  status: "Pending" | "Approved" | "Declined";
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  deliverables: Deliverable[];
  revisionLimit: number;
  revisionsUsed: number;
  price: number;
  status: ProjectStatus;
  changeRequests: ChangeRequest[];
  createdAt: string;
  deadline?: string;
  deliverablesLink?: string;
  paymentLink?: string;
}
