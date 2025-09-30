export interface Booking {
  id: string;
  client: {
    id: string;
    fullname: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  attorney: {
    fullname: string;
    email: string;
    id: string;
  };
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
}
