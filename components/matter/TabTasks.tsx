import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Matter } from "@/types/case";
import { Task, TaskDetails } from "@/types/task";
import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Stack,
  Table,
  TableScrollContainer,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import EmptyTableComponent from "../EmptyTableComponent";
import { IconCirclePlus, IconEye, IconTrash } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import TabTasksAddTaskModal from "./modals/TabTasksAddTaskModal";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getPriorityBadge } from "@/utils/getPriorityBadge";
import TabTasksDeleteTaskModal from "./modals/TabTasksDeleteTaskModal";
import TabTaskInfoTaskModal from "./modals/TabTaskInfoTaskModal";
import { getMatterStatus } from "@/utils/getMatterStatus";

interface MatterTabTasksProps {
  matterData: Matter;
  // setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function TabTasks({ matterData }: MatterTabTasksProps) {
  const theme = useMantineTheme();
  const { user } = useUser();

  const [dataChanged, setDataChanged] = useState(false);
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [allTasks, setAllTasks] = useState<Task[] | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [
    isAddTaskModalOpen,
    { open: openAddTaskModal, close: closeAddTaskModal },
  ] = useDisclosure(false);

  const [
    isDeleteTaskModalOpen,
    { open: openDeleteTaskModal, close: closeDeleteTaskModal },
  ] = useDisclosure(false);

  const [
    isInfoTaskModalOpen,
    { open: openInfoTaskModal, close: closeInfoTaskModal },
  ] = useDisclosure(false);

  const fetchAllTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, matterData.id);
      const taskSnap = await getDoc(taskRef);

      if (!taskSnap.exists()) return;

      const taskData = taskSnap.data() as TaskDetails;
      setTaskDetails(taskData);
      setAllTasks(taskData.tasks);
      setPendingTasks(
        taskData.tasks.filter(
          (task) => task.status === "Pending" && task.assignee.id === user?.id
        )
      );
    } catch (err) {
      console.error("fetchAllTasks error:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterData.id]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks, dataChanged]);

  const renderTableHeaders = () => {
    const taskTableHeaders = [
      "Task",
      "Deadline",
      "Assigned To",
      "Priority",
      "Status",
      "Actions",
    ];

    return (
      <Table.Thead>
        <Table.Tr>
          {taskTableHeaders.map((header) => (
            <Table.Th key={header}>{header}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
    );
  };

  const renderTableBody = (pending: boolean = false) => {
    if (!allTasks?.length)
      return (
        <Table.Tbody>
          <EmptyTableComponent colspan={6} message="No tasks found" />
        </Table.Tbody>
      );

    const tasksToMap = pending ? pendingTasks : allTasks;

    return (
      <Table.Tbody>
        {tasksToMap
          ?.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((task) => (
            <Table.Tr key={task.taskId}>
              <Table.Td>
                <Text fw={600} c="green" size="sm">
                  {task.taskName}
                </Text>
              </Table.Td>
              <Table.Td>{getDateFormatDisplay(task.dueDate, true)}</Table.Td>
              <Table.Td>{task.assignee.fullname}</Table.Td>
              <Table.Td>{getPriorityBadge(task.priority)}</Table.Td>
              <Table.Td>
                <Stack gap={0}>
                  {getMatterStatus(task.status)}
                  {task.completedAt && (
                    <Text size="xs" c="green" fw={600}>
                      {getDateFormatDisplay(task.completedAt, true)}
                    </Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Group gap={6}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={() => {
                      setSelectedTask(task);
                      openInfoTaskModal();
                    }}
                  >
                    <IconEye size={24} />
                  </ActionIcon>

                  {user?.unsafeMetadata?.role !== "client" &&
                    task.status !== "Completed" && (
                      <ActionIcon size="sm" variant="subtle" c="red">
                        <IconTrash
                          size={24}
                          onClick={() => {
                            setSelectedTask(task);
                            openDeleteTaskModal();
                          }}
                        />
                      </ActionIcon>
                    )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
      </Table.Tbody>
    );
  };

  return (
    <>
      <Stack gap="xl">
        {pendingTasks && pendingTasks?.length > 0 && (
          <Card withBorder radius="md" p="md" pos="relative">
            <LoadingOverlay visible={isLoading} />
            <Card.Section inheritPadding py="xs">
              <Group justify="space-between">
                <Text size="lg" fw={600} c={theme.other.customPumpkin}>
                  Your pending Tasks
                </Text>
              </Group>
            </Card.Section>

            <TableScrollContainer
              minWidth={500}
              mah="40vh"
              pos="relative"
              w="100%"
            >
              <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
                {renderTableHeaders()}
                {renderTableBody(true)}
              </Table>
            </TableScrollContainer>
          </Card>
        )}

        <Card withBorder radius="md" p="md" pos="relative">
          <LoadingOverlay visible={isLoading} />
          <Card.Section inheritPadding py="xs">
            <Group justify="space-between">
              <Text size="lg" fw={600} c="green">
                All Tasks
              </Text>

              {user?.unsafeMetadata?.role !== "client" && (
                <Button
                  leftSection={<IconCirclePlus />}
                  size="sm"
                  variant="outline"
                  onClick={openAddTaskModal}
                >
                  Add Task
                </Button>
              )}
            </Group>
          </Card.Section>

          <TableScrollContainer
            minWidth={500}
            mah="40vh"
            pos="relative"
            w="100%"
          >
            <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
              {renderTableHeaders()}
              {renderTableBody()}
            </Table>
          </TableScrollContainer>
        </Card>
      </Stack>

      <TabTasksAddTaskModal
        opened={isAddTaskModalOpen}
        onClose={closeAddTaskModal}
        matterData={matterData}
        setDataChanged={setDataChanged}
      />

      <TabTasksDeleteTaskModal
        opened={isDeleteTaskModalOpen}
        onClose={closeDeleteTaskModal}
        task={selectedTask}
        setDataChanged={setDataChanged}
        taskDetails={taskDetails}
      />

      <TabTaskInfoTaskModal
        opened={isInfoTaskModalOpen}
        onClose={closeInfoTaskModal}
        task={selectedTask}
        taskDetails={taskDetails}
        setDataChanged={setDataChanged}
        user={user ?? null}
      />
    </>
  );
}
