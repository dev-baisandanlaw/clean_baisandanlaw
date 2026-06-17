import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import { IconEye, IconTrash } from "@tabler/icons-react";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getPriorityBadge } from "@/utils/getPriorityBadge";
import { getMatterStatus } from "@/utils/getMatterStatus";
import { type MatterTask } from "@/types/matter";

type MatterTaskColumnHandlers = {
  onView: (task: MatterTask) => void;
  onDelete: (task: MatterTask) => void;
  userRole?: string;
};

export const createMatterTaskColumns = ({
  onView,
  onDelete,
  userRole,
}: MatterTaskColumnHandlers): ColumnDef<MatterTask>[] => [
  {
    accessorKey: "taskName",
    header: "Task",
    cell: ({ row }) => (
      <Text fw={600} c="green" size="sm">
        {row.original.taskName}
      </Text>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => (
      <Text size="sm">{getDateFormatDisplay(row.original.dueDate)}</Text>
    ),
  },
  {
    id: "assignee",
    header: "Assigned To",
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm">{row.original.assignee.fullname}</Text>
        <Text size="xs" c="dimmed">
          {row.original.assignee.division}
        </Text>
      </Stack>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => getPriorityBadge(row.original.priority),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Stack gap={0}>
        {getMatterStatus(row.original.status)}
        {row.original.completedAt && (
          <Text size="xs" c="green" fw={600}>
            {getDateFormatDisplay(row.original.completedAt, true)}
          </Text>
        )}
      </Stack>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    cell: ({ row }) => {
      const task = row.original;

      return (
        <Group gap={6}>
          <ActionIcon size="sm" variant="subtle" onClick={() => onView(task)}>
            <IconEye size={18} />
          </ActionIcon>

          {userRole !== "client" && task.status !== "Complete" && (
            <ActionIcon
              size="sm"
              variant="subtle"
              c="red"
              onClick={() => onDelete(task)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          )}
        </Group>
      );
    },
  },
];
