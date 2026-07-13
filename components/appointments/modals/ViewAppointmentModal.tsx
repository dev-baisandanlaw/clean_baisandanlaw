import {
  AreaBadge,
  BookingViaBadge,
  PaymentBadge,
} from "@/components/Common/BadgeComp";
import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import SpoilerComp from "@/components/Common/SpoilerComp";
import { Booking } from "@/types/booking";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";

type ViewAppointmentModalProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
};

export default function ViewAppointmentModal({
  opened,
  onClose,
  booking,
}: ViewAppointmentModalProps) {
  if (!booking) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600} c="green.0">
            Appointment Details
          </Text>
          <BookingViaBadge via={booking.via} />
        </Group>
      }
      size="xl"
      type="success"
      closable
    >
      <Stack>
        <BasicCard title="Client's Information">
          <SimpleGrid cols={{ base: 2, xs: 3 }}>
            <DetailField
              title="Full Name"
              value={booking.clientDetails.fullname}
            />
            <DetailField title="Email" value={booking.clientDetails.email} />
            <DetailField
              title="Phone Number"
              value={booking.clientDetails?.phone}
            />
            <DetailField
              title="Birthday"
              value={
                booking.clientDetails.birthday
                  ? dayjs(booking.clientDetails.birthday).format("MMM D, YYYY")
                  : undefined
              }
            />
            <DetailField
              title="Address"
              value={booking.clientDetails.fullAddress}
            />
          </SimpleGrid>
        </BasicCard>

        <BasicCard
          title="Booking Information"
          actionButton={
            <Group gap={4}>
              <Text size="xs">Payment Status: </Text>
              <PaymentBadge
                hasReceiptUploaded={!!booking.paymentFields?.fileId}
                isPaid={!!booking.paymentFields?.isApproved}
              />
            </Group>
          }
        >
          <SimpleGrid cols={{ base: 2, xs: 3 }} mb="md">
            <DetailField
              title="Assigned Attorney"
              value={booking.attorneyDetails?.fullname}
            />
            <DetailField
              title="Date & Time"
              value={getDateFormatDisplay(
                `${booking.date} ${booking.time}`,
                true,
              )}
            />
            <DetailField
              title="Consultation"
              value={
                booking?.consultationMode === "in-person"
                  ? (booking?.branch ?? undefined)
                  : booking?.consultationMode === "online"
                    ? "Online"
                    : undefined
              }
            />
            <DetailField title="Adverse Party" value={booking?.adverseParty} />
            <DetailField
              title="Represented by previous lawyer"
              value={booking?.representedByPreviousLawyer ? "Yes" : "No"}
            />
            <DetailField
              title="Areas"
              value={
                booking.areas.length > 0 ? (
                  <Group gap={4}>
                    {booking.areas.map((area) => (
                      <AreaBadge key={area} area={area} />
                    ))}
                  </Group>
                ) : undefined
              }
            />
          </SimpleGrid>
        </BasicCard>

        <BasicCard title="Description">
          <SpoilerComp>
            {booking?.message || "No description provided."}
          </SpoilerComp>
        </BasicCard>

        <Button
          onClick={onClose}
          variant="outline"
          ml="auto"
          display="block"
          mt="md"
        >
          Close
        </Button>
      </Stack>
    </AppModal>
  );
}
