import { Document } from "./document";
import { Note } from "./notes";
import { UserReference } from "./user-reference";

export interface Retainer {
  id: string;

  clientName: string;
  clientType: string;

  contactPerson: UserReference & { fullAddress: string };
  areas: string[];
  retainerSince: string;
  description?: string;

  documents?: Document[];
  notes?: Note[];

  googleDriveFolderId: string;

  createdAt: string;
  updatedAt: string;
}
