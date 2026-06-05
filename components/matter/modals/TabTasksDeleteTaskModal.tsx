import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { appNotifications } from "@/utils/notifications/notifications";
import { MatterTask } from "@/types/matter";
import { useDeleteMatterTaskMutation } from "@/store/services/matterService";

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
      .catch((e) => {
        console.log(e);
        appNotifications.error({
          title: "Failed to delete task",
          message: "The task could not be deleted. Please try again.",
        });
      });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Task"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isDeleting}
    >
      <Text ta="center" mb="md">
        Are you sure? This will remove the{" "}
        <Text fw={600} span>
          {task?.taskName}
        </Text>{" "}
        from the tasks and cannot be undone.
      </Text>

      <Button
        onClick={handleDeleteTask}
        loading={isDeleting}
        color="red"
        fullWidth
        leftSection={<IconTrash />}
      >
        I Understand
      </Button>
    </Modal>
  );
}
