import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Task, TaskDetails } from "@/types/task";
import { useUser } from "@clerk/nextjs";
import { Button, Modal, Text } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { MatterUpdateType } from "@/types/matter-updates";

interface TabTasksDeleteTaskModalProps {
  opened: boolean;
  onClose: () => void;
  task: Task | null;
  taskDetails: TaskDetails | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabTasksDeleteTaskModal({
  opened,
  onClose,
  task,
  taskDetails,
  setDataChanged,
}: TabTasksDeleteTaskModalProps) {
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.TASKS, taskDetails!.caseId),
        {
          tasks: taskDetails!.tasks.filter((t) => t.taskId !== task!.taskId),
        },
        { merge: true }
      );
      await addMatterUpdate(
        user!,
        taskDetails!.caseId,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.TASK,
        `Task Deleted: ${task!.taskName}`
      );

      toast.success("Task deleted successfully");
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
    onClose();
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
