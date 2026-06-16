import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconFileDownload, IconTrash } from "@tabler/icons-react";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getMimeTypeIcon } from "@/utils/getMimeTypeIcon";
import { type Document } from "@/types/document"; // adjust path as needed

type MatterDocumentColumnHandlers = {
  onDownload: (googleDriveId: string) => void;
  onDelete: (doc: Document) => void;
  canDelete: (doc: Document) => boolean;
  userId?: string;
  userRole?: string;
};

export const createMatterDocumentColumns = ({
  onDownload,
  onDelete,
  canDelete,
  userId,
  userRole,
}: MatterDocumentColumnHandlers): ColumnDef<Document>[] => [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
    cell: ({ row }) => (
      <Tooltip label={row.original.name || "-"} position="top">
        <Text truncate maw="200px" size="sm" fw={600} c="green">
          {row.original.name || "-"}
        </Text>
      </Tooltip>
    ),
  },
  {
    accessorKey: "sizeInMb",
    header: "Size",
    cell: ({ row }) => (
      <Text size="sm" fw={600} c="green">
        {row.original.sizeInMb} MB
      </Text>
    ),
  },
  {
    accessorKey: "mimeType",
    header: "Type",
    cell: ({ row }) => getMimeTypeIcon(row.original.mimeType),
  },
  {
    id: "uploadDetails",
    header: "Upload Details",
    cell: ({ row }) => (
      <Stack gap={0}>
        <Text size="sm" fw={600} c="green">
          {row.original.uploadedBy?.fullname || "-"}
        </Text>
        <Text size="xs" c="black" opacity={0.8}>
          {getDateFormatDisplay(row.original.uploadedAt, true)}
        </Text>
      </Stack>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    cell: ({ row }) => {
      const doc = row.original;

      return (
        <Group gap={6}>
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => onDownload(doc.googleDriveId ?? "")}
          >
            <IconFileDownload size={24} />
          </ActionIcon>

          {canDelete(doc) && (
            <ActionIcon
              variant="subtle"
              size="sm"
              color="red"
              onClick={() => onDelete(doc)}
              disabled={
                userRole === "client" ? doc.uploadedBy?.id !== userId : false
              }
            >
              <IconTrash />
            </ActionIcon>
          )}
        </Group>
      );
    },
  },
];
