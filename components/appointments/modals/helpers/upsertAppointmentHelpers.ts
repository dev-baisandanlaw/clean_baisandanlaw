import { type CreateBookingDto } from "@/store/service-types/type-booking-service";
import { type Booking } from "@/types/booking";
import { type UserReference } from "@/types/user-reference";
import dayjs from "dayjs";

export type ManualAppointmentFormValues = Omit<
  CreateBookingDto,
  "clientDetails" | "branch"
> & {
  hasAdverseParty: boolean;
  adverseParty: string;
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
    hasAdverseParty: false,
    adverseParty: "",
    representedByPreviousLawyer: false,
    dateValue: new Date(),
    date: dayjs().format("YYYY-MM-DD"),
    time: "",
    message: "",
    via: "Walk-in",
    areas: [],
    consultationMode: "in-person",
  });

export const buildAppointmentDetails = (
  values: ManualAppointmentFormValues,
  booking: Pick<Booking, "consultationMode" | "branch" | "adverseParty"> | null,
): Pick<CreateBookingDto, "consultationMode" | "branch" | "adverseParty"> => ({
  consultationMode: values.consultationMode,
  branch:
    values.consultationMode === "in-person"
      ? booking?.consultationMode === "in-person"
        ? (booking.branch ?? undefined)
        : "Angeles branch"
      : undefined,
  adverseParty: values.hasAdverseParty
    ? values.adverseParty.trim()
    : booking?.adverseParty
      ? ""
      : undefined,
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
