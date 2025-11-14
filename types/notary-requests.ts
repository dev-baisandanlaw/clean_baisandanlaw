type NotaryRequestDocument = {
  id: string;
  name: string;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    fullname: string;
  };
};

export enum NotaryRequestStatus {
  SUBMITTED = "submitted",
  PROCESSING = "processing",

  FOR_CLIENT_REVIEW = "for_client_review",
  CLIENT_APPROVED = "client_approved",
  CLIENT_REJECTED = "client_rejected",

  REJECTED = "rejected",
  FOR_PICKUP = "for_pickup",
  COMPLETED = "completed",

  CANCELLED = "cancelled",
}

export const NotaryRequestLabel: Record<NotaryRequestStatus, string> = {
  [NotaryRequestStatus.SUBMITTED]: "Submitted",

  [NotaryRequestStatus.PROCESSING]: "Processing",

  [NotaryRequestStatus.FOR_CLIENT_REVIEW]: "For Client Review",
  [NotaryRequestStatus.CLIENT_APPROVED]: "Client Approved",
  [NotaryRequestStatus.CLIENT_REJECTED]: "Client Rejected",

  [NotaryRequestStatus.REJECTED]: "Rejected",

  [NotaryRequestStatus.COMPLETED]: "Completed",
  [NotaryRequestStatus.FOR_PICKUP]: "For Pickup",
  [NotaryRequestStatus.CANCELLED]: "Cancelled",
};

export interface NotaryRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: NotaryRequestStatus;
  requestor: {
    id: string;
    fullname: string;
    email: string;
  };
  timeline?: NotaryRequestTimelineItem[];
  description: string;
  rejectedDetails: {
    reason: string;
    rejectedAt: string;
    rejectedBy: {
      id: string;
      fullname: string;
      email: string;
    };
  };
  documents: {
    googleDriveFolderId: string;
    initialFile: NotaryRequestDocument | null;
    finishedFile: NotaryRequestDocument | null;
  };
}

type NotaryRequestTimelineItem = {
  id: string;
  title: string;
  description: string;
  dateAndTime: string;
  user: {
    id: string;
    fullname: string;
    email: string;
  };
  reason?: string;
  status: NotaryRequestStatus;
};
