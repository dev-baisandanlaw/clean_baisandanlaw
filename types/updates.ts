import { UserReference } from "./user-reference";

export interface Update {
  id: string;

  description: string;

  matterId?: string | null;
  retainerId?: string | null;

  type: "detail" | "document" | "task" | "schedule";

  createdAt: string;
  updatedAt: string;

  user: UserReference;
}
