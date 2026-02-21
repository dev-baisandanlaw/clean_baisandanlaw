export interface Booking {
  id: string;
  client: {
    id: string;
    fullname: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthday?: string;
    fullAddress?: string;
  };
  attorney: {
    fullname: string;
    email: string;
    id: string;
  } | null;
  adverseParty: string;
  representedByPreviousLawyer: boolean;
  consultationMode: "in-person" | "online";
  branch?: "Angeles branch" | "Magalang branch" | null;
  areas?: string[];
  message: string;
  existingClient: boolean;
  date: string;
  time: string;
  isPaid: boolean;
  via:
    | "Website"
    | "Phone Call"
    | "Email"
    | "Walk-in"
    | "Facebook"
    | "Referral"
    | "Others";
  createdAt: string;
  updatedAt: string;
  googleCalendar: {
    eventId: string;
    htmlLink: string;
  };
}
