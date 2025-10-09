export enum MatterUpdateType {
  DESCRIPTION = "description",
  DOCUMENT = "document",
  TASK = "task",
  SCHEDULE = "schedule",
  SYSTEM = "system",
}

export interface MatterUpdate {
  id: string;
  type: MatterUpdateType;
  dateAndTime: string;
  user: {
    id: string;
    fullname: string;
    email: string;
  };
  updateDivision: "attorney" | "client" | "admin" | "paralegal" | "system";
  description: string;
}

export interface MatterUpdateDocument {
  id: string;
  updatedAt: string;
  items: MatterUpdate[];
}
