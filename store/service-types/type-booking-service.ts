import { UserReference } from "@/types/user-reference";

export interface GoogleCalendarDto {
  eventId: string;
  htmlLink: string;
}

export interface PaymentFieldsDto {
  approvedBy?: UserReference;
  approvedDate?: string;
  isApproved?: boolean;
  imageLink?: string;
  fileId?: string;
}

export interface CreateBookingDto {
  adverseParty?: string;
  areas: string[];
  attorneyDetails?: UserReference;
  clientDetails: UserReference;
  existingClient?: boolean;
  consultationMode: string;
  branch?: string;
  date: string;
  time: string;
  googleCalendar?: GoogleCalendarDto;
  paymentFields?: PaymentFieldsDto;
  message: string;
  via?: string;
}
