import { UserReference } from "./user-reference";

export interface Document {
  id: string;

  matterId: string | null;
  retainerId: string | null;
  clientRequestId: string | null;

  googleDriveParentFolderId: string;
  googleDriveId: string;

  mimeType: string;
  name: string;
  originalSize: number;
  sizeInMb: string;

  uploadedAt: string;
  uploadedBy: UserReference;
}
