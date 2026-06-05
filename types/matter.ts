import { UserReference } from "./user-reference";

export interface Matter {
  id: string;

  caseDescription: string;
  caseNumber: string;
  caseType: string[];

  clientData: UserReference;
  leadAttorney: UserReference;

  createdBy: UserReference;

  googleDriveFolderId: string;
  status: string;

  createdAt: string;
  updatedAt: string;
}
