import { Document } from "./document";
import { TaskStatus } from "./task";
import { UserReference } from "./user-reference";

export interface Matter {
  id: string;

  caseDescription: string;
  caseNumber: string;
  caseType: string[];

  clientData: UserReference;
  leadAttorney: UserReference;

  createdBy: UserReference;

  documents?: Document[];
  tasks?: MatterTask[];
  schedules?: MatterSchedule[];

  googleDriveFolderId: string;
  status: string;

  createdAt: string;
  updatedAt: string;
}

export interface MatterTask {
  id: string;

  assignee: UserReference;

  caseId: string;
  completedAt: string | null;
  description: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
  taskName: string;

  updatedAt: string;
  createdAt: string;
}

export interface MatterSchedule {
  id: string;

  caseId: string;
  date: string;
  time: string;

  location: string;
  title: string;
  description: string;

  createdAt: string;
  updatedAt: string;
}
