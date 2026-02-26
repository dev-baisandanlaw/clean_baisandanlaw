import type { Document } from "./case";
import type { Note } from "./matter-notes";

export interface Retainer {
  id: string;
  clientName: string;
  clientType: "individual" | "company";
  contactPerson: {
    fullname: string;
    email: string;
    phoneNumber: string;
    address: string;
  };

  retainerSince: string;
  practiceAreas: string[];
  description?: string;
  notes: Note[];
  documents: (Document & { googleDriveId: string })[];

  createdAt: string;
  updatedAt: string;

  googleDriveFolderId: string;
}
