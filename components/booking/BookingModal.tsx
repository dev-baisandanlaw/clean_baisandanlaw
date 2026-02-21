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
// import axios from "axios";
import {
  ATTY_PRACTICE_AREAS,
  COLLECTIONS,
  // PAYMONGO_CONFIG,
} from "@/constants/constants";
import { appNotifications } from "@/utils/notifications/notifications";
import { IconInfoCircle } from "@tabler/icons-react";
// import { IconInfoCircle } from "@tabler/icons-react";

export default function BookingModal({
  opened,
  onClose,
  selectedDate,
  selectedTime,
  user,
  successCallback,
  attorneyCount,
}: {
  opened: boolean;
  onClose: () => void;
  selectedDate: string | null;
  selectedTime: string | null;
  user: UserResource | null;
  successCallback: () => void;
  attorneyCount: number;
}) {
  const theme = useMantineTheme();

  const [isBooking, setIsBooking] = useState(false);

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
      where("time", "==", values.time)
    );

    await getDocs(q).then(({ docs }) => {
      // if the number of bookings that day and time is greater than or equal to the attorney count, return an error
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

      handleAddBooking(values);

      // axios({
      //   method: "POST",
      //   url: PAYMONGO_CONFIG.CHECKOUT_SESSION,
      //   headers: PAYMONGO_CONFIG.HEADERS,
      //   data: {
      //     data: {
      //       attributes: {
      //         // success_url: `${window.location.origin}/booking/`,
      //         cancel_url: `${window.location.origin}/booking`,
      //         send_email_receipt: true,
      //         show_description: true,
      //         show_line_items: true,
      //         description: "BaisAndan Law Office Booking Fee",
      //         line_items: [
      //           {
      //             currency: "PHP",
      //             amount: 20000,
      //             description: "Booking Fee",
      //             name: dayjs(form.values.date + " " + form.values.time).format(
      //               "dddd, MMMM D, YYYY - h:mm A"
      //             ),
      //             quantity: 1,
      //           },
      //         ],
      //         payment_method_types: ["gcash", "paymaya", "card"],
      //       },
      //     },
      //   },
      // })
      //   .then(({ data }) => {
      //     if (data?.data?.attributes?.checkout_url && data?.data?.id) {
      //       handleCheckoutUrl(data.data.attributes.checkout_url, data.data.id);
      //     }
      //   })
      //   .catch(() => {
      //     toast.error("Something went wrong. Please try again later.", {
      //       autoClose: 3000,
      //     });
      //     setIsBooking(false);
      //   });
    });
  };

  const handleAddBooking = async (values: typeof form.values) => {
    let clientDetails = {};

    const birthday = values.client.birthday
      ? dayjs(values.client.birthday).format("YYYY-MM-DD")
      : null;

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
      attorney: null, // Always null since the flow is: staff will assign the attorney
      via: "Website",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPaid: true,
    })
      .then(() => {
        onClose();
        form.reset();
        successCallback();
        appNotifications.success({
          title: "Booking submitted!",
          message:
            "Your booking has been submitted. You will receive an email confirmation once it's confirmed.",
          autoClose: 7500,
        });
      })
      .catch(() =>
        appNotifications.error({
          title: "Failed to book appointment",
          message: "The booking could not be submitted. Please try again.",
          autoClose: 3000,
        })
      )
      .finally(() => setIsBooking(false));
  };

  // const handleCheckoutUrl = (url: string, checkoutSessionId: string) => {
  //   const paymongoWindow = window.open(
  //     url,
  //     "_blank",
  //     "height=600 width=500 top=" +
  //       (window.outerHeight / 2 + window.screenY - 600 / 2) +
  //       ",left=" +
  //       (window.outerWidth / 2 + window.screenX - 500 / 2)
  //   );

  //   const checkPaymongoWindow = setInterval(() => {
  //     const handleExpireCheckoutSession = () => {
  //       axios({
  //         method: "POST",
  //         url: `${PAYMONGO_CONFIG.CHECKOUT_SESSION}/${checkoutSessionId}/expire`,
  //         headers: PAYMONGO_CONFIG.HEADERS,
  //       }).finally(() => {
  //         setIsBooking(false);
  //         toast.error("Payment failed. ", {
  //           autoClose: 3000,
  //         });
  //         form.reset();
  //         onClose();
  //       });
  //     };

  //     if (paymongoWindow?.closed) {
  //       clearInterval(checkPaymongoWindow);

  //       setTimeout(() => {
  //         axios({
  //           method: "GET",
  //           url: `${PAYMONGO_CONFIG.CHECKOUT_SESSION}/${checkoutSessionId}`,
  //           headers: PAYMONGO_CONFIG.HEADERS,
  //         })
  //           .then(({ data }) => {
  //             if (
  //               data?.data?.attributes?.payment_intent?.attributes?.status ===
  //               "succeeded"
  //             ) {
  //               handleAddBooking(form.values);
  //             } else {
  //               handleExpireCheckoutSession();
  //             }
  //           })
  //           .catch(() => {
  //             handleExpireCheckoutSession();
  //           });
  //       }, 2000);
  //     }
  //   }, 500);

  //   return () => {
  //     clearInterval(checkPaymongoWindow);
  //   };
  // };

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
      title="Confirm Booking"
      withCloseButton={!isBooking}
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
                  value ? dayjs(value, "YYYY-MM-DD").toDate() : null
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
            maxDropdownHeight={200}
            comboboxProps={{
              transitionProps: { transition: "pop-top-left", duration: 200 },
            }}
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
            Confirm Booking
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
