import { type CreateBookingDto } from "@/store/service-types/type-booking-service";
import { type UserReference } from "@/types/user-reference";
import dayjs from "dayjs";

export type ManualAppointmentFormValues = Omit<
  CreateBookingDto,
  "clientDetails"
> & {
  clientDetails: Omit<UserReference, "birthday"> & {
    birthday?: Date | null;
  };
  dateValue: Date | null;
};

export const getInitialManualAppointmentValues =
  (): ManualAppointmentFormValues => ({
    attorneyId: "",
    attorneyDetails: undefined,
    clientDetails: {
      fullname: "",
      email: "",
      id: "",
      phone: "",
      fullAddress: "",
      birthday: null,
    },
    existingClient: false,
    representedByPreviousLawyer: false,
    dateValue: new Date(),
    date: dayjs().format("YYYY-MM-DD"),
    time: "",
    message: "",
    via: "Walk-in",
    areas: [],
    consultationMode: "in-person",
    branch: "",
  });

export const buildClientDetails = (
  clientDetails: ManualAppointmentFormValues["clientDetails"],
): UserReference => ({
  fullname: clientDetails.fullname.trim(),
  email: clientDetails.email?.trim().toLowerCase() || "",
  id: clientDetails.id || clientDetails.email?.trim().toLowerCase() || "",
  phone: clientDetails.phone ? String(clientDetails.phone) : "",
  fullAddress: clientDetails.fullAddress?.trim() || "",
  birthday: clientDetails.birthday
    ? dayjs(clientDetails.birthday).format("YYYY-MM-DD")
    : undefined,
});
