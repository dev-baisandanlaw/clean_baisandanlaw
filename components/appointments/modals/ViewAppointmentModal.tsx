import { AreaBadge, BookingViaBadge } from "@/components/Common/BadgeComp";
import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import SpoilerComp from "@/components/Common/SpoilerComp";
import { Booking } from "@/types/booking";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { Button, Group, Modal, SimpleGrid, Stack, Text } from "@mantine/core";
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
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>View Appointment</Text>
          <BookingViaBadge via={booking.via} />
        </Group>
      }
      centered
      size="xl"
      transitionProps={{ transition: "pop" }}
    >
      <Stack>
        <BasicCard title="Client's Information">
          <SimpleGrid cols={{ base: 2, xs: 3 }}>
            <DetailField title="Full Name" value={booking.client.fullname} />
            <DetailField title="Email" value={booking.client.email} />
            <DetailField
              title="Phone Number"
              value={booking.client.phoneNumber || "-"}
            />
            <DetailField
              title="Birthday"
              value={
                booking.client.birthday
                  ? dayjs(booking?.client?.birthday).format("MMM D, YYYY")
                  : "-"
              }
            />
            <DetailField
              title="Address"
              value={booking.client.fullAddress || "-"}
            />
          </SimpleGrid>
        </BasicCard>

        <BasicCard title="Booking Information">
          <SimpleGrid cols={{ base: 2, xs: 3 }} mb="md">
            <DetailField
              title="Assigned Attorney"
              value={booking.attorney?.fullname || "-"}
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
                  ? booking?.branch || "-"
                  : booking?.consultationMode === "online"
                    ? "Online"
                    : "-"
              }
            />
            <DetailField
              title="Represented by Previous Lawyer"
              value={booking?.representedByPreviousLawyer ? "Yes" : "No"}
            />
            <DetailField
              title="Areas"
              value={
                <Group gap="xs">
                  {booking.areas?.map((area) => (
                    <AreaBadge key={area} area={area} />
                  ))}
                </Group>
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
    </Modal>
  );
}
