import { UserReference } from "./user-reference";

export type ClientRequestStatus =
  | "submitted"
  | "needs_client_revision"
  | "payment_pending"
  | "for_payment_verification"
  | "processing"
  | "for_client_review"
  | "client_rejected"
  | "client_approved"
  | "completed"
  | "cancelled";

export type ClientRequestActionKey =
  | "review_request"
  | "edit_request"
  | "approve_request"
  | "send_back_for_revision"
  | "cancel_request"
  | "resubmit_request"
  | "upload_payment"
  | "approve_payment"
  | "upload_finished_document"
  | "review_document"
  | "approve_document"
  | "reject_document"
  | "process_again"
  | "complete_request";

export type ClientRequestPickupMethod = "soft_copy" | "pickup";

export interface ClientRequestAction {
  key: ClientRequestActionKey;
  label: string;
  color: string;
}

export interface ClientRequest {
  id: string;

  description: string;

  finishedFileId: string | null;
  initialFileId: string | null;
  paymentReceiptFileId: string | null;
  googleDriveFolderId: string | null;

  fee: string | null;

  paymentVerifiedAt: string | null;
  paymentVerifiedBy: UserReference | null;

  pickupMethod: ClientRequestPickupMethod | null;
  pickupBranch: string | null;
  pickupDate: string | null;
  pickupTime: string | null;

  requestorId: string;
  requestorEmail: string;
  requestor: UserReference;
  status: ClientRequestStatus;

  createdAt: string;
  updatedAt: string;
}

export interface ClientRequestTimeline {
  id: string;
  clientRequestId: string;
  action: ClientRequestActionKey;
  status: ClientRequestStatus;
  description: string;
  remarks: string | null;
  createdBy: UserReference;
  createdAt: string;
  updatedAt: string;
}
