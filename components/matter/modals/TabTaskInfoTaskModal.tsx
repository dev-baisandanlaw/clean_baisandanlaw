import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getMatterStatus } from "@/utils/getMatterStatus";
import { getPriorityBadge } from "@/utils/getPriorityBadge";
import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";

import { appNotifications } from "@/utils/notifications/notifications";
import { MatterTask } from "@/types/matter";
import { UserResource } from "@clerk/types";
import { useCompleteMatterTaskMutation } from "@/store/services/matterService";
import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import SpoilerComp from "@/components/Common/SpoilerComp";
import AppModal from "@/components/Common/modal/AppModal";

interface TabTaskInfoTaskModalProps {
  opened: boolean;
  onClose: () => void;
  task: MatterTask | null;
  user?: UserResource | null;
}
export default function TabTaskInfoTaskModal({
  opened,
  onClose,
  task,
  user,
}: TabTaskInfoTaskModalProps) {
  const [completeMatterTaskFn, { isLoading: isSubmitting }] =
    useCompleteMatterTaskMutation();

  const canCompleteTask =
    user?.unsafeMetadata?.role !== "client"
      ? true
      : task?.assignee.id === user?.id;

  const handleCompleteTask = async () => {
    completeMatterTaskFn({ matterId: task!.caseId, taskId: task!.id })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Task completed successfully",
          message: "The task has been completed successfully",
        });
        onClose();
      })
      .catch(() => {
        appNotifications.error({
          title: "Failed to complete task",
          message: "The task could not be completed. Please try again",
        });
      });
  };

  if (!task) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Task Information"
      centered
      size="lg"
      closable={!isSubmitting}
      type="success"
    >
      <Stack gap="md">
        <BasicCard title={task.taskName}>
          <Stack>
            <SimpleGrid cols={2}>
              <DetailField
                title="Assignee"
                value={
                  <Group gap={4} align="center">
                    <Text size="sm">{task.assignee.fullname}</Text>
                    <Text size="sm" c="dimmed">
                      ({task.assignee.division})
                    </Text>
                  </Group>
                }
              />
              <DetailField
                title="Due date"
                value={getDateFormatDisplay(task.dueDate)}
              />

              <DetailField
                title="Status"
                value={
                  <Group gap={12}>
                    {getMatterStatus(task.status)}{" "}
                    {task.completedAt && (
                      <Text size="xs" c="green" fw={600}>
                        {getDateFormatDisplay(task.completedAt, true)}
                      </Text>
                    )}
                  </Group>
                }
              />
              <DetailField
                title="Priority"
                value={getPriorityBadge(task.priority)}
              />
            </SimpleGrid>

            <DetailField
              title="Description"
              value={
                <SpoilerComp>
                  {task.description || "No description provided."}
                </SpoilerComp>
              }
            />
          </Stack>
        </BasicCard>

        <Group justify="end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {task.status === "Pending" && canCompleteTask && (
            <Button onClick={handleCompleteTask} loading={isSubmitting}>
              Complete Task
            </Button>
          )}
        </Group>
      </Stack>
    </AppModal>
  );
}
