import { useState } from "react";

import axios from "axios";

import { Button, Modal, SimpleGrid, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { deleteDoc, doc } from "firebase/firestore";

import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";

import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";

import { Booking } from "@/types/booking";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteDuplicate = async () => {
    setIsLoading(true);
    try {
      // Cancel Google Calendar event if it exists
      if (booking?.googleCalendar?.eventId) {
        try {
          await axios.post("/api/google/calendar/cancel", {
            eventId: booking.googleCalendar.eventId,
          });
        } catch {
          // Continue with deletion even if calendar cancellation fails
        }
      }

      // Delete the appointment from Firebase
      await deleteDoc(doc(db, COLLECTIONS.BOOKINGS, booking!.id));

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
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Duplicate Appointment"
      centered
      size="lg"
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isLoading}
    >
      <Text ta="center" mb="md">
        Are you sure you want to flag this appointment as a duplicate? Once
        confirmed, the appointment will be deleted and cannot be undone.
      </Text>

      <BasicCard title="Appointment Details">
        <SimpleGrid cols={2}>
          <DetailField title="Client" value={booking.client.fullname} />
          <DetailField title="Attorney" value={booking.attorney?.fullname} />
          <DetailField
            title="Date & Time"
            value={getDateFormatDisplay(
              `${booking.date} ${booking.time}`,
              true,
            )}
          />
          <DetailField title="Via" value={booking.via} />
        </SimpleGrid>
      </BasicCard>

      <Button
        onClick={handleDeleteDuplicate}
        loading={isLoading}
        color="red"
        fullWidth
        leftSection={<IconTrash />}
        mt="md"
      >
        I Understand
      </Button>
    </Modal>
  );
}
