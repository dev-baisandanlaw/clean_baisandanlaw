export type AppwriteDocument<T> = {
  documents: T[];
  total: number;
};

export interface AppwriteMatterDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  clientId: string;
  clientFirstName: string;
  clientLastName: string;

  leadAttorneyId: string;
  leadAttorneyFirstName: string;
  leadAttorneyLastName: string;

  status: string;
  matterType: string;
  matterNumber: string;

  createdAt: string;
  updatedAt: string;
}

export interface AppwriteNotaryRequestDocument {
  referenceNumber: string;
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  requestorEmail: string;
  requestorFullName: string;

  documentInitialFileId: string;
  documentFinishedFileId: string;

  status: string;
  search_blob: string;
}

export interface AppwriteRetainersDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;

  client: string;

  contactPersonName: string;
  contactPersonEmail: string;

  retainerSince: string;
  matterType: string;
}
