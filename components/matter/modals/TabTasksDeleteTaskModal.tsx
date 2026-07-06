import { appNotifications } from "@/utils/notifications/notifications";
import { MatterTask } from "@/types/matter";
import { useDeleteMatterTaskMutation } from "@/store/services/matterService";
import DeleteModal from "@/components/Common/modal/DeleteModal";

interface TabTasksDeleteTaskModalProps {
  opened: boolean;
  onClose: () => void;
  task: MatterTask | null;
}

export default function TabTasksDeleteTaskModal({
  opened,
  onClose,
  task,
}: TabTasksDeleteTaskModalProps) {
  const [deleteMatterTaskFn, { isLoading: isDeleting }] =
    useDeleteMatterTaskMutation();

  const handleDeleteTask = async () => {
    deleteMatterTaskFn({ matterId: task!.caseId, taskId: task!.id })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Task deleted successfully",
          message: "The task has been deleted successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to delete task",
          message: "The task could not be deleted. Please try again.",
        });
      });
  };

  return (
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Delete Task"
      action="delete"
      entityType="task"
      handleDelete={handleDeleteTask}
      isLoading={isDeleting}
    />
  );
}
