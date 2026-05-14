"use client";

import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Checkbox,
  Select,
  Radio,
  useMantineTheme,
  Flex,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { UserResource } from "@clerk/types";
import dayjs from "dayjs";
import { TimeValue, DateInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { ATTY_PRACTICE_AREAS, COLLECTIONS } from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
import { GlobalSched } from "@/types/global-sched";
import BookingPaymentModal from "./BookingPaymentModal";
import { useDisclosure } from "@mantine/hooks";
import axios from "axios";

export default function BookingModal({
  opened,
  onClose,
  selectedDate,
  selectedTime,
  user,
  successCallback,
  attorneyCount,
  globalSched,
}: {
  opened: boolean;
  onClose: () => void;
  selectedDate: string | null;
  selectedTime: string | null;
  user: UserResource | null;
  successCallback: () => void;
  attorneyCount: number;
  globalSched: GlobalSched | null;
}) {
  const theme = useMantineTheme();

  const [isBooking, setIsBooking] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [
    isPaymentModalOpen,
    { open: openPaymentModal, close: closePaymentModal },
  ] = useDisclosure();

  const form = useForm({
    initialValues: {
      client: {
        id: "",
        fullname: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        fullAddress: "",
        birthday: null as Date | null,
      },
      adverseParty: "",
      representedByPreviousLawyer: false,
      consultationMode: "in-person",
      branch: "",
      message: "",
      date: "",
      time: "",
      areas: [] as string[],
    },

    validate: {
      client: {
        firstName: (value) => (!value.length ? "First name is required" : null),
        lastName: (value) => (!value.length ? "Last name is required" : null),
        email: (value) =>
          !value?.length
            ? "Email is required"
            : /^\S+@\S+$/.test(value)
              ? null
              : "Invalid Email",
        phoneNumber: (value) =>
          String(value).length < 10 ? "Invalid Phone Number" : null,
        fullAddress: (value) =>
          !value || !String(value).length ? "Full address is required" : null,
        birthday: (value) => (value ? null : "Birthday is required"),
      },
      branch: (value, values) =>
        values.consultationMode === "in-person" && !value
          ? "Please select a branch"
          : null,
      areas: (value) =>
        !value.length ? "Please select at least one area" : null,
      message: (value) => (!value.length ? "Message is required" : null),
    },

    validateInputOnChange: true,
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsBooking(true);

    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where("date", "==", values.date),
      where("time", "==", values.time),
    );

    await getDocs(q).then(({ docs }) => {
      if (docs.length >= attorneyCount) {
        appNotifications.error({
          title: "Failed to book appointment",
          message:
            "Selected date and time is already booked. Please select a different date and time",
          autoClose: 7500,
        });

        setIsBooking(false);
        return;
      }

      setIsBooking(false);
      openPaymentModal();
    });
  };

  const handleAddBooking = async (
    values: typeof form.values,
    receiptFileId?: string,
  ) => {
    const birthday = values.client.birthday
      ? dayjs(values.client.birthday).format("YYYY-MM-DD")
      : null;

    let clientDetails = {};

    if (user) {
      clientDetails = {
        fullname: user.fullName || "",
        id: user.id,
        email: user.emailAddresses[0].emailAddress as string,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber:
          (user.unsafeMetadata?.phoneNumber as string) ||
          values.client.phoneNumber,
        fullAddress: form.values.client.fullAddress || "",
        birthday,
      };
    } else {
      clientDetails = {
        fullname: values.client.firstName + " " + values.client.lastName,
        id: "",
        email: values.client.email,
        firstName: values.client.firstName,
        lastName: values.client.lastName,
        phoneNumber: values.client.phoneNumber || "",
        fullAddress: values.client.fullAddress || "",
        birthday,
      };
    }

    await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
      ...values,
      existingClient: !!user,
      client: clientDetails,
      attorney: null,
      via: "Website",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paymentFields: {
        receiptFileId: receiptFileId || "",
        isPaid: false,
      },
    })
      .then(() => {
        onClose();
        form.reset();
        successCallback();
        appNotifications.success({
          title: "Booking submitted!",
          message: "Your booking has been submitted successfully.",
          autoClose: 7500,
        });
      })
      .catch(() =>
        appNotifications.error({
          title: "Failed to book appointment",
          message: "The booking could not be submitted. Please try again.",
          autoClose: 3000,
        }),
      );
  };

  const handlePaymentSubmit = async (receiptFile: File) => {
    setIsUploadingReceipt(true);

    try {
      // Upload receipt to Google Drive
      const dateTime = dayjs(`${form.values.date} ${form.values.time}`).format(
        "YYYY-MM-DD-hh_mm_a",
      );

      const formData = new FormData();

      formData.append(
        "file",
        receiptFile,
        `[${form.values.client.email}]-[${form.values.client.firstName}-${form.values.client.lastName}]-[${dateTime}]-[receipt]`,
      );
      formData.append(
        "parentId",
        process.env.NEXT_PUBLIC_GOOGLE_RECEIPTS_APPOINTMENTS_FOLDER_ID!,
      );

      const { data } = await axios.post(
        "/api/google/drive/upload_receipts",
        formData,
      );

      await handleAddBooking(form.values, data?.uploadedFiles?.id);
      closePaymentModal();
    } catch {
      appNotifications.error({
        title: "Failed to upload receipt",
        message: "Could not upload your receipt. Please try again.",
        autoClose: 5000,
      });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  useEffect(() => {
    if (opened && !!user) {
      const unsafeAddress = user.unsafeMetadata?.fullAddress as
        | string
        | undefined;
      const unsafeBirthday = user.unsafeMetadata?.birthday as
        | string
        | undefined;
      const unsafePhoneNumber = user.unsafeMetadata?.phoneNumber as
        | string
        | undefined;

      form.setValues({
        client: {
          fullAddress: unsafeAddress || "",
          birthday: unsafeBirthday
            ? dayjs(unsafeBirthday, "YYYY-MM-DD").toDate()
            : null,
          fullname: user.fullName || "",
          id: user.id,
          email: user.emailAddresses[0].emailAddress as string,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: unsafePhoneNumber || "",
        },
      });
    }

    if (selectedDate && selectedTime) {
      form.setValues({
        date: selectedDate,
        time: selectedTime,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, user]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Booking Information"
      withCloseButton={!isBooking && !isUploadingReceipt}
      centered
      size="xl"
    >
      {user && (
        <Alert
          mb="sm"
          color="blue"
          variant="light"
          styles={(theme) => ({
            title: { fontWeight: 600, color: theme.colors.blue[7] },
            message: { color: theme.colors.blue[7] },
            body: { gap: 2 },
            root: { paddingBlock: 12 },
          })}
          icon={<IconInfoCircle />}
          title="You are currently logged in"
        >
          <Text size="xs">
            Some of your personal details are already filled in and disabled
            because you are currently logged in.
          </Text>
        </Alert>
      )}

      <Text mb={8}>
        Booking for{" "}
        <strong>
          {selectedDate && dayjs(selectedDate).format("dddd, MMMM D, YYYY")}{" "}
          {selectedTime && <TimeValue value={selectedTime} format="12h" />}
        </strong>
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack mb="md">
          <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
            <TextInput
              withAsterisk
              label="First Name"
              placeholder="Enter First Name"
              {...form.getInputProps("client.firstName")}
              disabled={!!user?.firstName}
              flex={1}
            />

            <TextInput
              withAsterisk
              label="Last Name"
              placeholder="Enter Last Name"
              {...form.getInputProps("client.lastName")}
              disabled={!!user?.lastName}
              flex={1}
            />
          </Flex>

          <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
            <TextInput
              withAsterisk
              label="Email"
              placeholder="Enter your email"
              {...form.getInputProps("client.email")}
              disabled={!!user?.emailAddresses[0].emailAddress}
              flex={1}
            />

            <NumberInput
              withAsterisk
              hideControls
              label="Phone Number"
              maxLength={10}
              placeholder="912 345 6789"
              leftSection={
                <Text size="sm" c="dimmed">
                  +63
                </Text>
              }
              allowNegative={false}
              {...form.getInputProps("client.phoneNumber")}
              disabled={!!user?.unsafeMetadata?.phoneNumber}
              flex={1}
            />
          </Flex>

          <TextInput
            withAsterisk
            label="Full Address"
            placeholder="Enter full address"
            {...form.getInputProps("client.fullAddress")}
            disabled={!!user?.unsafeMetadata?.fullAddress}
          />

          <Flex gap="sm" direction={{ base: "column", sm: "row" }}>
            <DateInput
              withAsterisk
              label="Birthday"
              placeholder="1970-01-01"
              valueFormat="YYYY-MM-DD"
              value={form.values.client.birthday}
              onChange={(value: string | null) =>
                form.setFieldValue(
                  "client.birthday",
                  value ? dayjs(value, "YYYY-MM-DD").toDate() : null,
                )
              }
              disabled={!!user?.unsafeMetadata?.birthday}
              flex={1}
            />

            <TextInput
              label="Adverse Party"
              placeholder="Enter adverse party"
              {...form.getInputProps("adverseParty")}
              flex={1}
            />
          </Flex>

          <Radio.Group
            name="consultationMode"
            label="Consultation Type"
            withAsterisk
            {...form.getInputProps("consultationMode")}
          >
            <Group mt="xs">
              <Radio value="in-person" label="In person consultation" />
              <Radio value="online" label="Online consultation" />
            </Group>
          </Radio.Group>

          {form.values.consultationMode === "in-person" && (
            <Select
              withAsterisk
              label="Branch"
              placeholder="Select Branch"
              data={[
                { value: "Angeles branch", label: "Angeles branch" },
                { value: "Magalang branch", label: "Magalang branch" },
              ]}
              {...form.getInputProps("branch")}
            />
          )}

          <TagsInput
            withAsterisk
            label="Areas"
            placeholder="Select Areas"
            data={ATTY_PRACTICE_AREAS}
            clearable
            styles={{
              pill: {
                backgroundColor: theme.colors.green[0],
                color: theme.colors.green[9],
              },
            }}
            {...form.getInputProps("areas")}
          />

          <Textarea
            withAsterisk
            label="Message"
            placeholder="Something you might want to share before the appointment"
            {...form.getInputProps("message")}
            styles={{ input: { paddingBlock: 6 } }}
            rows={5}
            maxLength={1000}
            inputWrapperOrder={["label", "error", "input", "description"]}
            description={`${form.values.message.length}/1000 characters`}
          />

          <Checkbox
            label="Represented by previous lawyer"
            {...form.getInputProps("representedByPreviousLawyer", {
              type: "checkbox",
            })}
          />
        </Stack>

        <Group justify="end">
          <Button variant="outline" onClick={onClose} disabled={isBooking}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.isValid()} loading={isBooking}>
            Proceed to Payment
          </Button>
        </Group>
      </form>

      <BookingPaymentModal
        opened={isPaymentModalOpen}
        onClose={closePaymentModal}
        globalSched={globalSched}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSubmit={handlePaymentSubmit}
        isSubmitting={isUploadingReceipt}
      />
    </Modal>
  );
}
