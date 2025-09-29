export interface Booking {
  id: string;
  client: {
    fullname: string;
    id: string;
  };
  attorney: {
    fullname: string;
    id: string;
  };
  message: string;
  date: string;
  time: string;
  phoneNumber?: string;
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
