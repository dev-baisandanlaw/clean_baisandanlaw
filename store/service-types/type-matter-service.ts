import { Matter } from "@/types/matter";
import { GenericPaginatedResponse } from "@/types/pagination";
import { UserReference } from "@/types/user-reference";

export type MatterListingResponse = GenericPaginatedResponse<
  Pick<
    Matter,
    | "id"
    | "caseNumber"
    | "caseType"
    | "clientData"
    | "leadAttorney"
    | "createdAt"
    | "updatedAt"
  >
>;

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
