import { Document } from "./case";
import { Note } from "./matter-notes";

export interface Retainer {
  id: string;
  clientName: string;
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
