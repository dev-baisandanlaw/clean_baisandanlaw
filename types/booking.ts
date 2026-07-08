import { UserReference } from "./user-reference";

export interface BookingPaymentFields {
  approvedBy?: UserReference | null;
  approvedDate?: string;
  isApproved?: boolean;
  amount?: string;
  imageLink?: string;
  fileId?: string;
}

export interface Booking {
  id: string;
  adverseParty: string | null;
  areas: string[];
  attorneyDetails: UserReference | null;
  attorneyId: string | null;
  clientDetails: UserReference;
  clientEmail: string;
  existingClient: boolean;
  representedByPreviousLawyer?: boolean | null;
  consultationMode: string;
  branch: string | null;
  date: string;
  time: string;
  googleCalendar: {
    eventId: string;
    htmlLink: string;
  } | null;
  paymentFields: BookingPaymentFields | null;
  message: string;
  via: string;
  createdAt: string;
  updatedAt: string;
}
