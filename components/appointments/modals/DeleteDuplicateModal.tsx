import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Booking } from "@/types/booking";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Button, Modal, Table, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";

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

      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160}>Client</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {booking.client.fullname}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Attorney</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {booking.attorney?.fullname}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Date & Time</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {getDateFormatDisplay(`${booking.date} ${booking.time}`, true)}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Via</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {booking.via}
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

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
