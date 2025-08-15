export interface Case {
  id: string;
  clientData: {
    id: string;
    fullname: string;
  };
  caseNumber: string;
  status: string;
  leadAttorney: {
    id: string;
    fullname: string;
  };
  documents: Document[];
  caseType: string[];
  createdAt: string;
  updatedAt: string;
  caseDescription: string;
  schedules: Schedule[];
}

type Document = {
  id: string;
  name: string;
  mimeType: string;
  originalSize: number;
  sizeInMb: number;
  uploadedAt: string;
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
