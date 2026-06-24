import { Button, Group, Progress, ScrollArea, Text } from "@mantine/core";
import AppModal from "../Common/modal/AppModal";
import { useRef, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { TimeValue } from "@mantine/dates";
import { useForm } from "@mantine/form";
import BookingStepTwo from "./booking-steps/BookingStep2";
import BookingStepThree from "./booking-steps/BookingStep3";
import BookingStepOne from "./booking-steps/BookingStep1";
import {
  useBookNewAppointmentMutation,
  useUploadBookingReceiptMutation,
} from "@/store/services/bookingService";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import { BookingSettings } from "@/types/bookingSettings";

interface RevampedBookingModalProps {
  opened: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
  bookingSettings?: BookingSettings;
  successCallback?: () => void;
}

export type BookingFormTypeValues = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  fullAddress: string;
  birthday: null | Date;
  adverseParty: string;
  consultationType: string;
  branch: string;
  areas: string[];
  message: string;
  representedByPreviousLawyer: boolean;
};

export default function RevampedBookingModal({
  opened = true,
  onClose,
  selectedDate,
  selectedTime,
  bookingSettings,
  successCallback,
}: RevampedBookingModalProps) {
  const { user } = useUser();
  const [bookAppointmentFn, { isLoading: isBooking }] =
    useBookNewAppointmentMutation();
  const [uploadDocumentFn, { isLoading: isUploading }] =
    useUploadBookingReceiptMutation();

  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [uploadedReceipt, setUploadedReceipt] = useState<File | null>(null);

  const appointmentFee = Number(bookingSettings?.appointmentFeePerHour ?? 0);
  const paymentChannels = useMemo(
    () =>
      bookingSettings?.paymentChannels.filter((channel) => channel.enabled) ??
      [],
    [bookingSettings],
  );

  const form = useForm<BookingFormTypeValues>({
    initialValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      fullAddress: "",
      birthday: null as Date | null,
      adverseParty: "",
      consultationType: "in-person",
      branch: "",
      areas: [],
      message: "",
      representedByPreviousLawyer: false,
    },

    validate: {
      firstname: (value) => (!value.length ? "First name is required" : null),
      lastname: (value) => (!value.length ? "Last name is required" : null),
      email: (value) =>
        !value?.length
          ? "Email is required"
          : /^\S+@\S+$/.test(value)
            ? null
            : "Invalid Email",
      phone: (value) =>
        String(value).length < 10 ? "Invalid Phone Number" : null,
      fullAddress: (value) =>
        !value || !String(value).length ? "Full address is required" : null,
      birthday: (value) => (value ? null : "Birthday is required"),
      branch: (value, values) =>
        values.consultationType === "in-person" && !value
          ? "Please select a branch"
          : null,
      areas: (value) =>
        !value.length ? "Please select at least one area" : null,
      message: (value) => (!value.length ? "Message is required" : null),
    },

    validateInputOnChange: true,
  });

  const resetModalState = () => {
    form.reset();
    setStep(0);
    setUploadedReceipt(null);
  };

  const handleSubmit = (values: BookingFormTypeValues) => {
    if (step < 2) {
      setStep((p) => p + 1);
      return;
    }

    if (step === 2) {
      if (!uploadedReceipt) return;
      const dateTime = dayjs(`${selectedDate} ${selectedTime}`).format(
        "YYYY-MM-DD-hh_mm_a",
      );

      const filename = `[${form.values.email}]-[${form.values.firstname}-${form.values.lastname}]-[${dateTime}]-[receipt]`;

      uploadDocumentFn({ file: uploadedReceipt, filename })
        .unwrap()
        .then((uploadedFile) => {
          const normalizedEmail = values.email.trim().toLowerCase();
          const payload = {
            adverseParty: values.adverseParty.trim() || undefined,
            areas: values.areas,
            clientDetails: {
              fullname:
                `${values.firstname.trim()} ${values.lastname.trim()}`.trim(),
              email: normalizedEmail,
              id: normalizedEmail,
              role: "client",
              phone: values.phone,
              fullAddress: values.fullAddress.trim(),
              birthday: values.birthday
                ? dayjs(values.birthday).format("YYYY-MM-DD")
                : undefined,
            },
            existingClient: false,
            representedByPreviousLawyer: values.representedByPreviousLawyer,
            consultationMode: values.consultationType,
            branch:
              values.consultationType === "in-person"
                ? values.branch
                : undefined,
            date: dayjs(selectedDate).format("YYYY-MM-DD"),
            time: selectedTime,
            paymentFields: {
              fileId:
                uploadedFile.fileId ||
                (uploadedFile as unknown as { id?: string }).id ||
                "",
            },
            message: values.message.trim(),
            via: "Website",
          };

          bookAppointmentFn(payload)
            .unwrap()
            .then(() => {
              appNotifications.success({
                title: "Booking submitted",
                message: "Your appointment request has been submitted.",
              });
              resetModalState();
              successCallback?.();
              onClose();
            })
            .catch((e) => {
              const message =
                e?.data?.message ||
                "The appointment could not be booked. Please try again";
              appNotifications.error({
                title: "Failed to book appointment",
                message,
              });
            });
        })
        .catch((e) => {
          const message =
            e?.data?.message || "The file cannot be uploaded. Please try again";
          appNotifications.error({
            title: "Failed to upload file",
            message,
          });
        });
    }
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (!opened || !user) return;

    const unsafeAddress =
      (user.unsafeMetadata?.fullAddress as string | undefined) ||
      (user.unsafeMetadata?.fullAddres as string | undefined);
    const unsafeBirthday = user.unsafeMetadata?.birthday as string | undefined;
    const unsafePhoneNumber = user.unsafeMetadata?.phoneNumber as
      | string
      | undefined;

    form.setValues({
      firstname: user.firstName || "",
      lastname: user.lastName || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      phone: unsafePhoneNumber || "",
      fullAddress: unsafeAddress || "",
      birthday: unsafeBirthday
        ? dayjs(unsafeBirthday, "YYYY-MM-DD").toDate()
        : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, user]);

  if (!selectedDate || !selectedTime) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      type="success"
      title="New booking"
      size="lg"
      closable={!isBooking && !isUploading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <div ref={topRef} />
        <Text mb={8} ta="center">
          Booking for{" "}
          <strong>
            {dayjs(selectedDate).format("dddd, MMMM D, YYYY")}{" "}
            <TimeValue value={selectedTime} format="12h" />
          </strong>
        </Text>

        <Group grow gap={6} mb="xs">
          <Progress
            size="sm"
            color={step < 1 ? "orange" : "green"}
            value={100}
            animated={step < 1}
          />
          <Progress
            size="sm"
            color={step === 1 ? "orange" : step < 1 ? "gray" : "green"}
            value={100}
            animated={step === 1}
          />
          <Progress
            size="sm"
            color={step < 2 ? "gray" : uploadedReceipt ? "green" : "orange"}
            value={100}
            animated={step === 2 && !uploadedReceipt}
          />
        </Group>

        <ScrollArea.Autosize>
          {step === 0 && <BookingStepOne form={form} />}
          {step === 1 && <BookingStepTwo form={form} />}
          {step === 2 && (
            <BookingStepThree
              uploadedReceipt={uploadedReceipt}
              setUploadedReceipt={setUploadedReceipt}
              fee={appointmentFee}
              paymentChannels={paymentChannels}
            />
          )}
        </ScrollArea.Autosize>

        <Group mt={16} justify="end" gap="xs">
          <Button
            size="sm"
            variant="default"
            onClick={step < 1 ? () => onClose() : () => setStep((p) => p - 1)}
            disabled={isBooking || isUploading}
          >
            {step < 1 ? "Cancel" : "Back"}
          </Button>

          <Button
            type="submit"
            loading={isBooking || isUploading}
            disabled={
              step === 0
                ? !form.isValid()
                : step === 2
                  ? !uploadedReceipt
                  : false
            }
          >
            {step < 2 ? "Proceed to next step" : " Submit"}
          </Button>
        </Group>
      </form>
    </AppModal>
  );
}
