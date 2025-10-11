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
  notes: Note[];

  createdAt: string;
  updatedAt: string;

  googleDriveFolderId: string;
}
