import DeleteModal from "@/components/Common/modal/DeleteModal";
import { useDeleteMatterScheduleMutation } from "@/store/services/matterService";
import { MatterSchedule } from "@/types/matter";
import { appNotifications } from "@/utils/notifications/notifications";

interface TabScheduleDeleteScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  schedule: MatterSchedule | null;
}

export default function TabScheduleDeleteScheduleModal({
  opened,
  onClose,
  schedule,
}: TabScheduleDeleteScheduleModalProps) {
  const [deleteMatterScheduleFn, { isLoading: isDeleting }] =
    useDeleteMatterScheduleMutation();

  const handleDeleteSchedule = async () => {
    if (!schedule) return;

    deleteMatterScheduleFn({ id: schedule.id })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Schedule deleted successfully",
          message: "The schedule has been deleted successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to delete schedule",
          message: "The schedule could not be deleted. Please try again.",
        });
      });
  };

  return (
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Delete Schedule"
      action="delete"
      entityType="schedule"
      handleDelete={handleDeleteSchedule}
      isLoading={isDeleting}
      confirmDisabled={!schedule}
    />
  );
}
