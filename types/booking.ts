export interface Booking {
  id: string;
  fullname: string;
  email: string;
  message: string;
  date: string;
  time: string;
  userId: string;
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
