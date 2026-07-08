import {
  ClientRequest,
  ClientRequestAction,
  ClientRequestPickupMethod,
  ClientRequestStatus,
  ClientRequestTimeline,
} from "@/types/clientRequest";
import { GenericPaginatedResponse } from "@/types/pagination";

export type ClientRequestPaymentStatus = {
  value: "paid" | "for_verification" | "pending" | "not_set";
  receiptFileId: string | null;
  isPaid: boolean;
};

export type ClientRequestListingItem = Pick<
  ClientRequest,
  | "id"
  | "description"
  | "requestor"
  | "requestorEmail"
  | "initialFileId"
  | "finishedFileId"
  | "createdAt"
  | "updatedAt"
  | "fee"
  | "status"
  | "pickupMethod"
  | "pickupBranch"
  | "pickupDate"
  | "pickupTime"
> & {
  pickup: string | null;
  paymentStatus: ClientRequestPaymentStatus;
  actions: ClientRequestAction[];
};

export type ClientRequestListingResponse =
  GenericPaginatedResponse<ClientRequestListingItem>;

export type ClientRequestDetailsResponse = ClientRequest & {
  initialFileName: string | null;
  paymentStatus: ClientRequestPaymentStatus;
  actions: ClientRequestAction[];
};

export type ClientRequestTimelineResponse = {
  data: ClientRequestTimeline[];
};

export type ClientRequestListingParams = {
  page: number;
  limit: number;
  search?: string;
  status?: ClientRequestStatus;
};

export interface CreateClientRequestDto {
  description: string;
  file?: File | null;
}

export type UpdateClientRequestDto = CreateClientRequestDto & {
  id: string;
  removeInitialFile?: boolean;
};

export interface ApproveClientRequestDto {
  id: string;
  fee: string;
}

export interface ClientRequestRemarksDto {
  id: string;
  remarks: string;
}

export interface UploadClientRequestPaymentDto {
  id: string;
  file: File;
}

export interface UploadClientRequestFinishedDocumentDto {
  id: string;
  file: File;
}

export interface ApproveClientRequestDocumentDto {
  id: string;
  pickupMethod: ClientRequestPickupMethod;
  pickupBranch?: string | null;
  pickupDate?: string | null;
  pickupTime?: string | null;
  remarks?: string;
}

export interface RejectClientRequestDocumentDto {
  id: string;
  remarks: string;
}

export interface CompleteClientRequestDto {
  id: string;
  remarks?: string;
}

export interface CancelClientRequestDto {
  id: string;
  remarks?: string;
}

export interface ProcessAgainClientRequestDto {
  id: string;
}

export interface UpdateClientRequestStatusDto {
  id: string;
  status: ClientRequestStatus;
}
