import { appNotifications } from "@/utils/notifications/notifications";

import { Booking } from "@/types/booking";
import DeleteModal from "@/components/Common/modal/DeleteModal";
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
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Delete Appointment"
      action="delete"
      entityType="appointment"
      handleDelete={handleDeleteDuplicate}
      isLoading={isDeleting}
    />
  );
}
