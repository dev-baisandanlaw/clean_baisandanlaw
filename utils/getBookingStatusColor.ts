import { Booking } from "@/types/booking";

export const getBookingViaColor = (via: Booking["via"]) => {
  switch (via) {
    case "Website":
      return "green";
    case "Phone Call":
      return "teal";
    case "Email":
      return "cyan";
    case "Walk-in":
      return "purple";
    case "Facebook":
      return "yellow";
    case "Referral":
      return "orange";
    default:
      return "blue";
  }
};
