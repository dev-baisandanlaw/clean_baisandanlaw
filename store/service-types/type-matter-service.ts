import { Matter } from "@/types/matter";
import { UserReference } from "@/types/user-reference";

export type MatterListingResponse = Pick<
  Matter,
  | "id"
  | "caseNumber"
  | "caseType"
  | "clientData"
  | "leadAttorney"
  | "createdAt"
  | "updatedAt"
>[];

export interface CreateNewMatterDto {
  caseNumber: string;
  leadAttorney: UserReference;
  clientData: UserReference;
  caseType: string[];
  caseDescription: string;
}

export interface CreateNewMatterTaskDto {
  caseId: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  taskName: string;
  assignee: UserReference;
}
