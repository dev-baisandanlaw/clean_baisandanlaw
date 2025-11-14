import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Task, TaskDetails } from "@/types/task";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getMatterStatus } from "@/utils/getMatterStatus";
import { getPriorityBadge } from "@/utils/getPriorityBadge";
import { UserResource } from "@clerk/types";
import { Button, Group, Modal, Stack, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { addMatterUpdate } from "../utils/addMatterUpdate";
import { MatterUpdateType } from "@/types/matter-updates";
import { appNotifications } from "@/utils/notifications/notifications";

interface TabTaskInfoTaskModalProps {
  opened: boolean;
  onClose: () => void;
  task: Task | null;
  taskDetails: TaskDetails | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserResource | null;
}
export default function TabTaskInfoTaskModal({
  opened,
  onClose,
  task,
  taskDetails,
  setDataChanged,
  user,
}: TabTaskInfoTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const canCompleteTask =
    user?.unsafeMetadata?.role !== "client"
      ? true
      : task?.assignee.id === user?.id;

  const handleCompleteTask = async () => {
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.TASKS, taskDetails!.caseId),
        {
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          tasks: taskDetails!.tasks.map((t) =>
            t.taskId === task!.taskId
              ? {
                  ...t,
                  status: "Completed",
                  completedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                }
              : t
          ),
        },
        { merge: true }
      );
      await addMatterUpdate(
        user!,
        taskDetails!.caseId,
        user?.unsafeMetadata.role as string,
        MatterUpdateType.TASK,
        `Task Completed: ${task!.taskName}`
      );

      appNotifications.success({
        title: "Task completed successfully",
        message: "The task has been completed successfully",
      });

      setDataChanged((prev) => !prev);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Task Information"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
    >
      <Stack gap="md">
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Name</Table.Th>
              <Table.Td>
                <Text fw={600} c="green" size="sm">
                  {task.taskName}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Due Date</Table.Th>
              <Table.Td>{getDateFormatDisplay(task.dueDate, true)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Status</Table.Th>
              <Table.Td>
                <Group gap={12}>
                  {getMatterStatus(task.status)}{" "}
                  {task.completedAt && (
                    <Text size="xs" c="green" fw={600}>
                      {getDateFormatDisplay(task.completedAt, true)}
                    </Text>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Priority</Table.Th>
              <Table.Td>{getPriorityBadge(task.priority)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Description</Table.Th>
              <Table.Td>{task.description}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Group justify="end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {task.status === "Pending" && canCompleteTask && (
            <Button onClick={handleCompleteTask} loading={isLoading}>
              Complete Task
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
