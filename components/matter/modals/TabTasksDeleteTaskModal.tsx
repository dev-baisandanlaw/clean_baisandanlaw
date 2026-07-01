import { Button, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { appNotifications } from "@/utils/notifications/notifications";
import { MatterTask } from "@/types/matter";
import { useDeleteMatterTaskMutation } from "@/store/services/matterService";
import AppModal from "@/components/Common/modal/AppModal";

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
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Delete Task"
      closable={!isDeleting}
      type="danger"
    >
      <Text mb="md">
        Are you sure? This will remove the{" "}
        <Text fw={600} span>
          {task?.taskName}
        </Text>{" "}
        from the tasks and cannot be undone.
      </Text>

      <Button
        onClick={handleDeleteTask}
        loading={isDeleting}
        color="red.5"
        fullWidth
        leftSection={<IconTrash />}
      >
        I Understand
      </Button>
    </AppModal>
  );
}
