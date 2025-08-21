export interface Matter {
  id: string;
  caseDescription: string;
  caseNumber: string;
  caseType: string[];
  clientData: LocalUser;
  createdAt: string;
  documents: Document[];
  involvedAttorneys: LocalUser[];
  leadAttorney: LocalUser;
  status: string;
  updatedAt: string;
}

type LocalUser = {
  id: string;
  fullname: string;
  imageUrl?: string;
};

type Document = {
  id: string;
  name: string;
  mimeType: string;
  originalSize: number;
  sizeInMb: number;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    fullname: string;
  };
};

export type Schedule = {
  scheduleId: string;
  title: string;
  dateAndTime: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};
