import { useUser } from "@clerk/nextjs";
import {
  ActionIcon,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { IconCirclePlus, IconEye, IconTrash } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getPriorityBadge } from "@/utils/getPriorityBadge";
import { getMatterStatus } from "@/utils/getMatterStatus";
import { Matter, MatterTask } from "@/types/matter";
import BasicCard from "../Common/BasicCard";
import DetailField from "../Common/DetailField";
import TabTasksAddTaskModal from "./modals/TabTasksAddTaskModal";
import TabTasksDeleteTaskModal from "./modals/TabTasksDeleteTaskModal";
import TabTaskInfoTaskModal from "./modals/TabTaskInfoTaskModal";

interface MatterTabTasksProps {
  matterData: Matter;
}

export default function TabTasks({ matterData }: MatterTabTasksProps) {
  const { user } = useUser();

  const [selectedTask, setSelectedTask] = useState<MatterTask | null>(null);

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

  const tasksByDivision = (division: string) =>
    matterData?.tasks?.filter((task) => task.assignee?.division === division) ||
    [];

  const taskSummary = (division: string) => {
    const tasks = tasksByDivision(division);

    return `${tasks.filter((task) => task.status === "Complete").length} / ${tasks.length}`;
  };

  const renderTableHeaders = () => {
    const taskTableHeaders = [
      "Task",
      "Due date",
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

  const renderTableBody = () => {
    const tasksToMap =
      matterData?.tasks && matterData?.tasks?.length > 0
        ? matterData.tasks || []
        : [];

    return (
      <Table.Tbody>
        {tasksToMap
          // ?.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .map((task) => (
            <Table.Tr key={task.id}>
              <Table.Td>
                <Text fw={600} c="green" size="sm">
                  {task.taskName}
                </Text>
              </Table.Td>
              <Table.Td>{getDateFormatDisplay(task.dueDate)}</Table.Td>
              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm">{task.assignee.fullname}</Text>
                  <Text size="xs" c="dimmed">
                    {task.assignee.division}
                  </Text>
                </Stack>
              </Table.Td>
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
                    task.status !== "Complete" && (
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
        <BasicCard
          title="Tasks"
          actionButton={
            user?.unsafeMetadata?.role !== "client" && (
              <Button
                leftSection={<IconCirclePlus size={18} />}
                size="xs"
                variant="outline"
                onClick={openAddTaskModal}
              >
                Add Task
              </Button>
            )
          }
        >
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 3, md: 3 }}>
            <DetailField title="All" value={matterData?.tasks?.length || "0"} />

            <DetailField
              title="Pending"
              value={
                matterData?.tasks?.filter((i) => i.status === "Pending")
                  .length || "0"
              }
            />

            <DetailField
              title="Complete"
              value={
                matterData?.tasks?.filter((i) => i.status === "Complete")
                  .length || "0"
              }
            />

            <DetailField title="Attorney" value={taskSummary("Attorney")} />
            <DetailField title="Client" value={taskSummary("Client")} />
            <DetailField title="Staff" value={taskSummary("Staff")} />
          </SimpleGrid>
        </BasicCard>

        <TableScrollContainer minWidth={800} h="60vh" pos="relative" w="100%">
          <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
            {renderTableHeaders()}
            {renderTableBody()}
          </Table>
        </TableScrollContainer>
      </Stack>

      <TabTasksAddTaskModal
        opened={isAddTaskModalOpen}
        onClose={closeAddTaskModal}
        matterData={matterData}
      />

      <TabTasksDeleteTaskModal
        opened={isDeleteTaskModalOpen}
        onClose={closeDeleteTaskModal}
        task={selectedTask}
      />

      <TabTaskInfoTaskModal
        opened={isInfoTaskModalOpen}
        onClose={closeInfoTaskModal}
        task={selectedTask}
        user={user ?? null}
      />
    </>
  );
}
