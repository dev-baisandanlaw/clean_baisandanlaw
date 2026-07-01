"use client";

import AppointmentsList from "@/components/appointments/AppointmentsList";
import AppointmentSummary from "@/components/appointments/AppointmentSummary";
import AppointmentsDatePicker from "@/components/appointments/DatePickerFilter";
import DeleteDuplicateModal from "@/components/appointments/modals/DeleteDuplicateModal";
import UpsertAppointmentModal from "@/components/appointments/modals/UpsertAppointmentModal";
import ViewAppointmentModal from "@/components/appointments/modals/ViewAppointmentModal";
import ReceiptPreviewModal from "@/components/Common/ReceiptPreviewModal";
import { Booking } from "@/types/booking";
import { useUser } from "@clerk/nextjs";
import {
  Alert,
  Badge,
  Button,
  em,
  Flex,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useMediaQuery,
} from "@mantine/hooks";
import { IconCirclePlus, IconFlame, IconSettings } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import SettingsModal from "@/components/appointments/modals/SettingsModal";
import { useRouter } from "nextjs-toploader/app";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import {
  useApproveBookingReceiptMutation,
  useGetBookingsByMonthQuery,
  useGetBookingSettingsQuery,
  useGetPendingAttorneyAssignmentBookingsQuery,
} from "@/store/services/bookingService";
import { appNotifications } from "@/utils/notifications/notifications";

dayjs.extend(isSameOrAfter);

const ymd = dayjs().format("YYYY-MM-DD");

export default function AppointmentsFeature() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);

  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [approveBookingReceiptFn] = useApproveBookingReceiptMutation();
  const { data: bookingSettings, isFetching: isFetchingBookingSettings } =
    useGetBookingSettingsQuery(undefined, {
      skip: user?.unsafeMetadata?.role !== "admin",
    });

  const { data: noAttorneyBookings = [] } =
    useGetPendingAttorneyAssignmentBookingsQuery(undefined, {
      skip: !isLoaded || user?.unsafeMetadata?.role !== "admin",
    });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(ymd);
  const [currentDate, setCurrentDate] = useState<string>(ymd);
  const [debounced] = useDebouncedValue(currentDate, 150);
  const { data: bookings = [], isFetching: isFetchingBookings } =
    useGetBookingsByMonthQuery(
      { month: debounced },
      { skip: !isLoaded || !user },
    );

  const [
    settingsModalOpened,
    { open: openSettingsModal, close: closeSettingsModal },
  ] = useDisclosure(false);
  const [viewModal, { open: openViewModal, close: closeViewModal }] =
    useDisclosure(false);
  const [deleteModal, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [upsertModal, { open: openUpsertModal, close: closeUpsertModal }] =
    useDisclosure(false);
  const [
    receiptPreviewModal,
    { open: openReceiptPreviewModal, close: closeReceiptPreviewModal },
  ] = useDisclosure(false);

  const handleApproveReceipt = async () => {
    if (!selectedBooking?.id) return;

    await approveBookingReceiptFn({ id: selectedBooking.id })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Payment approved",
          message: "The booking receipt has been approved.",
        });
      });
  };

  return (
    <>
      {user?.unsafeMetadata?.role === "admin" &&
        noAttorneyBookings.length > 0 && (
          <Alert
            title="Pending Attorney Assignment"
            color="red"
            icon={<IconFlame />}
            mb="xl"
            styles={(theme) => ({
              title: { fontWeight: 700, color: theme.colors.red[4] },
              icon: { color: theme.colors.red[4] },
              message: {
                color: theme.colors.red[4],
                textAlign: "justify",
                paddingRight: 16,
              },
              root: {
                backgroundColor: theme.colors.red[0],
                boxShadow: theme.other.customBoxShadow,
                borderRadius: 10,
              },
            })}
          >
            <Text mb="xs" size="sm">
              There are future bookings waiting for an attorney assignment.
            </Text>

            <Group gap="xs">
              {[...noAttorneyBookings]
                .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
                .map((booking) => (
                  <Badge
                    key={booking.id}
                    variant="outline"
                    color="red"
                    radius="xs"
                  >
                    {getDateFormatDisplay(
                      `${booking.date} ${booking.time}`,
                      true,
                    )}
                  </Badge>
                ))}
            </Group>
          </Alert>
        )}
      <Flex
        w="100%"
        h="100%"
        gap={16}
        px={{ sm: 12, md: 0 }}
        direction="column"
      >
        <Group align="center" justify="center">
          <AppointmentsDatePicker
            bookings={bookings}
            selectedDate={selectedDate}
            setCurrentDate={setCurrentDate}
            setSelectedDate={setSelectedDate}
          />

          <Stack flex={1}>
            {user?.unsafeMetadata?.role === "admin" && (
              <Group
                justify="space-between"
                {...(isMobile ? { grow: true } : {})}
              >
                <Button
                  leftSection={<IconCirclePlus />}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBooking(null);
                    openUpsertModal();
                  }}
                >
                  Add Appointment
                </Button>

                <Button
                  leftSection={<IconSettings />}
                  size="sm"
                  loading={isFetchingBookingSettings}
                  variant="outline"
                  onClick={openSettingsModal}
                >
                  Settings
                </Button>
              </Group>
            )}

            {user?.unsafeMetadata?.role === "client" && (
              <Button
                leftSection={<IconCirclePlus />}
                size="sm"
                onClick={() => router.push("/booking")}
              >
                Book Appointment
              </Button>
            )}

            <AppointmentSummary
              bookings={bookings}
              currentDate={currentDate}
              selectedDate={selectedDate}
            />
          </Stack>
        </Group>

        <AppointmentsList
          data={bookings || []}
          isLoading={isFetchingBookings}
          selectedDate={selectedDate}
          onView={(booking) => {
            setSelectedBooking(booking);
            openViewModal();
          }}
          onEdit={(booking) => {
            setSelectedBooking(booking);
            openUpsertModal();
          }}
          onDelete={(booking) => {
            setSelectedBooking(booking);
            openDeleteModal();
          }}
          onViewReceipt={(booking) => {
            setSelectedBooking(booking);
            openReceiptPreviewModal();
          }}
          userRole={user?.unsafeMetadata?.role as string | undefined}
        />
      </Flex>

      <ViewAppointmentModal
        opened={viewModal}
        onClose={closeViewModal}
        booking={selectedBooking}
      />

      <DeleteDuplicateModal
        opened={deleteModal}
        onClose={closeDeleteModal}
        booking={selectedBooking}
      />

      <UpsertAppointmentModal
        opened={upsertModal}
        onClose={closeUpsertModal}
        booking={selectedBooking}
        bookingSettings={bookingSettings}
      />

      <SettingsModal
        opened={settingsModalOpened}
        onClose={closeSettingsModal}
        bookingSettings={bookingSettings}
      />

      <ReceiptPreviewModal
        opened={receiptPreviewModal}
        onClose={closeReceiptPreviewModal}
        receiptFileId={selectedBooking?.paymentFields?.fileId ?? ""}
        isPaid={selectedBooking?.paymentFields?.isApproved ?? false}
        onApprove={handleApproveReceipt}
        filenamePrefix="booking-receipt"
        source="appointments"
      />
    </>
  );
}
