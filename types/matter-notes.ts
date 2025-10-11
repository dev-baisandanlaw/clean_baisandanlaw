export interface Note {
  id: string;
  user: {
    id: string;
    fullname: string;
    email: string;
  };

  createdAt: string;
  updatedAt: string;

  content: string;
  isImportant: boolean;
}

interface MatterNote {
  id: string;
  matterId: string;
  notes: Note[];
  updatedAt: string;
}

export type { MatterNote };
