"use client";

import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { UserResource } from "@clerk/types";
import dayjs from "dayjs";
import { TimeValue } from "@mantine/dates";
import { useEffect, useState } from "react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "react-toastify";
import axios from "axios";
import { COLLECTIONS, PAYMONGO_CONFIG } from "@/constants/constants";
import { IconInfoCircle } from "@tabler/icons-react";

export default function BookingModal({
  opened,
  onClose,
  selectedDate,
  selectedTime,
  user,
  successCallback,
}: {
  opened: boolean;
  onClose: () => void;
  selectedDate: string | null;
  selectedTime: string | null;
  user: UserResource | null;
  successCallback: () => void;
}) {
  const [isBooking, setIsBooking] = useState(false);

  const form = useForm({
    initialValues: {
      fullname: "",
      userId: "",
      email: "",
      message: "",
      date: "",
      time: "",
      phoneNumber: "",
    },

    validate: {
      fullname: (value) =>
        !!value.length ? null : "Full name must be at least 3 characters",
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },

    validateInputOnChange: true,
  });

  const handleSubmit = (values: typeof form.values) => {
    setIsBooking(true);
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where("date", "==", values.date),
      where("time", "==", values.time)
    );

    getDocs(q).then(({ docs }) => {
      if (docs.length > 0) {
        toast.error(
          "Selected date and time is already booked. Please select a different date and time.",
          { autoClose: 7500 }
        );
        setIsBooking(false);
        return;
      }

      axios({
        method: "POST",
        url: PAYMONGO_CONFIG.CHECKOUT_SESSION,
        headers: PAYMONGO_CONFIG.HEADERS,
        data: {
          data: {
            attributes: {
              // success_url: `${window.location.origin}/booking/`,
              cancel_url: `${window.location.origin}/booking`,
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              description: "BaisAndan Law Office Booking Fee",
              line_items: [
                {
                  currency: "PHP",
                  amount: 20000,
                  description: "Booking Fee",
                  name: dayjs(form.values.date + " " + form.values.time).format(
                    "dddd, MMMM D, YYYY - h:mm A"
                  ),
                  quantity: 1,
                },
              ],
              payment_method_types: ["gcash", "paymaya", "card"],
            },
          },
        },
      })
        .then(({ data }) => {
          if (data?.data?.attributes?.checkout_url && data?.data?.id) {
            handleCheckoutUrl(data.data.attributes.checkout_url, data.data.id);
          }
        })
        .catch(() => {
          toast.error("Something went wrong. Please try again later.", {
            autoClose: 3000,
          });
          setIsBooking(false);
        });
    });
  };

  const handleAddBooking = (values: typeof form.values) => {
    addDoc(collection(db, COLLECTIONS.BOOKINGS), {
      ...values,
      phoneNumber: values.phoneNumber || "",
    })
      .then(() => {
        onClose();
        form.reset();
        successCallback();
        toast.success("Booking submitted!");
      })
      .catch(() =>
        toast.error("Something went wrong. Please try again later.", {
          autoClose: 3000,
        })
      )
      .finally(() => setIsBooking(false));
  };

  const handleCheckoutUrl = (url: string, checkoutSessionId: string) => {
    const paymongoWindow = window.open(
      url,
      "_blank",
      "height=600 width=500 top=" +
        (window.outerHeight / 2 + window.screenY - 600 / 2) +
        ",left=" +
        (window.outerWidth / 2 + window.screenX - 500 / 2)
    );

    const checkPaymongoWindow = setInterval(() => {
      const handleExpireCheckoutSession = () => {
        axios({
          method: "POST",
          url: `${PAYMONGO_CONFIG.CHECKOUT_SESSION}/${checkoutSessionId}/expire`,
          headers: PAYMONGO_CONFIG.HEADERS,
        }).finally(() => {
          setIsBooking(false);
          toast.error("Payment failed. ", {
            autoClose: 3000,
          });
          form.reset();
          onClose();
        });
      };

      if (paymongoWindow?.closed) {
        clearInterval(checkPaymongoWindow);

        setTimeout(() => {
          axios({
            method: "GET",
            url: `${PAYMONGO_CONFIG.CHECKOUT_SESSION}/${checkoutSessionId}`,
            headers: PAYMONGO_CONFIG.HEADERS,
          })
            .then(({ data }) => {
              if (
                data?.data?.attributes?.payment_intent?.attributes?.status ===
                "succeeded"
              ) {
                handleAddBooking(form.values);
              } else {
                handleExpireCheckoutSession();
              }
            })
            .catch(() => {
              handleExpireCheckoutSession();
            });
        }, 2000);
      }
    }, 500);

    return () => {
      clearInterval(checkPaymongoWindow);
    };
  };

  useEffect(() => {
    if (opened && !!user) {
      form.setValues({
        fullname: user.fullName as string,
        email: user.emailAddresses[0].emailAddress as string,
        userId: user.id,
        phoneNumber: (user.unsafeMetadata?.phoneNumber as string) || "",
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
      size="lg"
    >
      <Alert
        title="Important"
        color="blue"
        icon={<IconInfoCircle />}
        mb="sm"
        styles={(theme) => ({
          title: { fontWeight: 700, color: theme.colors.blue[4] },
          icon: { color: theme.colors.blue[4] },
          message: {
            color: theme.colors.blue[4],
            textAlign: "justify",
            paddingRight: 16,
          },
          root: {
            backgroundColor: theme.colors.blue[0],
            boxShadow: theme.other.customBoxShadow,
            borderRadius: 10,
          },
          body: { gap: 2 },
        })}
      >
        <Text size="xs" fw={600}>
          To secure your booking, a non-refundable booking fee of{" "}
          <strong>₱200</strong> is required. This fee confirms your reservation
          and ensures that your preferred schedule is reserved exclusively for
          you.
        </Text>
      </Alert>
      <Text mb={8}>
        Booking for{" "}
        <strong>
          {selectedDate && dayjs(selectedDate).format("dddd, MMMM D, YYYY")}{" "}
          {selectedTime && <TimeValue value={selectedTime} format="12h" />}
        </strong>
      </Text>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          withAsterisk
          data-autofocus
          label="Full Name"
          placeholder="Enter your full name"
          {...form.getInputProps("fullname")}
          readOnly={!!user?.fullName}
          mb={16}
        />

        <TextInput
          withAsterisk
          label="Email"
          placeholder="Enter your email"
          {...form.getInputProps("email")}
          readOnly={!!user?.emailAddresses[0].emailAddress}
          mb={16}
        />

        <NumberInput
          hideControls
          label={
            <Text>
              Phone number{" "}
              <Text span size="xs" c="gray.7">
                (optional)
              </Text>
            </Text>
          }
          maxLength={10}
          placeholder="912 345 6789"
          leftSection={
            <Text size="sm" c="black">
              +63
            </Text>
          }
          allowNegative={false}
          {...form.getInputProps("phoneNumber")}
          readOnly={!!user?.unsafeMetadata?.phoneNumber}
          mb={16}
        />

        <Textarea
          label="Message"
          placeholder="Something you might want to share before the appointment"
          {...form.getInputProps("message")}
          rows={5}
          mb={16}
        />

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
