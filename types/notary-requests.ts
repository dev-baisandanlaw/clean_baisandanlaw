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
  NEEDS_CLIENT_REVISION = "needs_client_revision",
  PAYMENT_PENDING = "payment_pending",
  FOR_ADMIN_PAYMENT_VERIFICATION = "for_admin_payment_verification",
  PROCESSING = "processing",
  FOR_CLIENT_REVIEW = "for_client_review",
  NEEDS_ATTORNEY_REVISION = "needs_attorney_revision",
  CLIENT_APPROVED = "client_approved",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export const NotaryRequestLabel: Record<NotaryRequestStatus, string> = {
  [NotaryRequestStatus.SUBMITTED]: "Submitted",
  [NotaryRequestStatus.NEEDS_CLIENT_REVISION]: "Needs Client Revision",
  [NotaryRequestStatus.PAYMENT_PENDING]: "Payment Pending",
  [NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION]:
    "For Payment Verification",
  [NotaryRequestStatus.PROCESSING]: "Processing",
  [NotaryRequestStatus.FOR_CLIENT_REVIEW]: "For Client Review",
  [NotaryRequestStatus.NEEDS_ATTORNEY_REVISION]: "Needs Attorney Revision",
  [NotaryRequestStatus.CLIENT_APPROVED]: "Client Approved",
  [NotaryRequestStatus.COMPLETED]: "Completed",
  [NotaryRequestStatus.CANCELLED]: "Cancelled",
};

export interface NotaryRequest {
  referenceNumber: string;
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
  paymentFields?: {
    fee: number;
    receiptFileId: string;
    isPaid: boolean;
  };
  pickupBranch?: "Angeles branch" | "Magalang branch" | "Soft copy only" | null;
  pickupDate?: Date | string | null;
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
