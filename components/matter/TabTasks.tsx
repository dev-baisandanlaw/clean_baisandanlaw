import { useUser } from "@clerk/nextjs";
import { Button, SimpleGrid, Stack } from "@mantine/core";
import { useMemo, useState } from "react";
import { IconCirclePlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Matter, MatterTask } from "@/types/matter";
import BasicCard from "../Common/BasicCard";
import DetailField from "../Common/DetailField";
import TabTasksAddTaskModal from "./modals/TabTasksAddTaskModal";
import TabTasksDeleteTaskModal from "./modals/TabTasksDeleteTaskModal";
import TabTaskInfoTaskModal from "./modals/TabTaskInfoTaskModal";
import { createMatterTaskColumns } from "../data-table/columns-no-pagination/MatterTaskColumn";
import DataTableNoPagination from "../data-table/DataTableNoPagination";

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
    matterData?.tasks?.filter((task) => task.assignee?.division === division) ??
    [];

  const taskSummary = (division: string) => {
    const tasks = tasksByDivision(division);
    return `${tasks.filter((task) => task.status === "Complete").length} / ${tasks.length}`;
  };

  const columns = useMemo(
    () =>
      createMatterTaskColumns({
        onView: (task) => {
          setSelectedTask(task);
          openInfoTaskModal();
        },
        onDelete: (task) => {
          setSelectedTask(task);
          openDeleteTaskModal();
        },
        userRole: user?.unsafeMetadata?.role as string | undefined,
      }),
    [user, openInfoTaskModal, openDeleteTaskModal],
  );

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

        <DataTableNoPagination
          columns={columns}
          data={matterData?.tasks ?? []}
          emptyText="No tasks found."
        />
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
