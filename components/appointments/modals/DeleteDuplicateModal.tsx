import { Button, SimpleGrid, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import { BookingViaBadge, PaymentBadge } from "@/components/Common/BadgeComp";

import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";

import { Booking } from "@/types/booking";
import AppModal from "@/components/Common/modal/AppModal";
import { useDeleteBookingMutation } from "@/store/services/bookingService";

type DeleteDuplicateModalProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
};

export default function DeleteDuplicateModal({
  opened,
  onClose,
  booking,
}: DeleteDuplicateModalProps) {
  const [deleteBookingFn, { isLoading: isDeleting }] =
    useDeleteBookingMutation();

  const handleDeleteDuplicate = async () => {
    if (!booking) return;

    try {
      await deleteBookingFn({ id: booking.id }).unwrap();
      appNotifications.success({
        title: "Appointment deleted successfully",
        message: "The appointment has been deleted successfully",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to delete duplicate",
        message: "The appointment could not be deleted. Please try again.",
      });
    }
  };

  if (!booking) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Delete Appointment"
      size="xl"
      closable={!isDeleting}
      type="danger"
    >
      <Text ta="center" mb="md">
        Are you sure you want to flag this appointment as a duplicate? Once
        confirmed, the appointment will be deleted and cannot be undone.
      </Text>

      <BasicCard title="Appointment Details">
        <SimpleGrid cols={{ base: 2, xs: 3 }}>
          <DetailField title="Client" value={booking.clientDetails.fullname} />
          <DetailField
            title="Attorney"
            value={booking.attorneyDetails?.fullname}
          />
          <DetailField
            title="Payment Status"
            value={
              <PaymentBadge
                hasReceiptUploaded={!!booking?.paymentFields?.fileId}
                isPaid={booking?.paymentFields?.isApproved || false}
              />
            }
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
                ? booking?.branch ?? undefined
                : booking?.consultationMode === "online"
                  ? "Online"
                  : undefined
            }
          />
          <DetailField
            title="Via"
            value={<BookingViaBadge via={booking.via} />}
          />
        </SimpleGrid>
      </BasicCard>

      <Button
        onClick={handleDeleteDuplicate}
        loading={isDeleting}
        color="red.7"
        fullWidth
        leftSection={<IconTrash />}
        mt="md"
      >
        I Understand
      </Button>
    </AppModal>
  );
}
