import { UserReference } from "./user-reference";

export interface Note {
  id: string;

  note: string;
  createdAt: string;
  updatedAt: string;

  isUpdated: boolean;

  createdBy: UserReference;
}
