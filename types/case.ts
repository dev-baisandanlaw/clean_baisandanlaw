export interface Matter {
  id: string;
  caseDescription: string;
  caseNumber: string;
  caseType: string[];
  clientData: LocalUser;
  createdAt: string;
  documents: Document[];
  // involvedAttorneys: LocalUser[];
  leadAttorney: LocalUser;
  status: string;
  updatedAt: string;
  schedules?: Schedule[];
}

type LocalUser = {
  id: string;
  fullname: string;
  imageUrl?: string;
  email: string;
};

export type Document = {
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
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};
