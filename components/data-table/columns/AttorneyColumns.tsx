import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Text } from "@mantine/core";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "@/components/Common/BadgeComp";
import {
  IconBan,
  IconPencil,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import TableUserField from "@/components/Common/TableUserField";
import { UserReference } from "@/types/user-reference";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AttorneyRow = UserReference & { metadata: any };

export const createAttorneyColumns = (
  onBanToggleClick: (attorney: AttorneyRow) => void,
  onUpdateClick: (attorney: AttorneyRow) => void,
  onDeleteClick: (attorney: AttorneyRow) => void,
): ColumnDef<AttorneyRow>[] => [
  {
    accessorKey: "fullname",
    header: "Name",
    size: 250,
    cell: ({ row }) => (
      <Text
        size="sm"
        fw={600}
        c={row.original?.metadata?.banned ? "red" : "green"}
      >
        {row.original.fullname ?? "-"}
      </Text>
    ),
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { email, phone, metadata } = row.original;
      const isBanned = metadata?.banned;

      return (
        <TableUserField
          title={email || "-"}
          subTitle={phone}
          titleColor={isBanned ? "red" : "green"}
        />
      );
    },
  },
  {
    accessorKey: "metadata",
    header: "Practice Area",
    size: 300,
    cell: ({ row }) => {
      const metadata = row.original.metadata;

      if (metadata?.practiceAreas && metadata.practiceAreas.length > 0) {
        return (
          <Group gap={2} wrap="wrap" style={{ overflow: "hidden" }}>
            {metadata.practiceAreas.map((a: string) => (
              <AreaBadge area={a} key={a} />
            ))}
          </Group>
        );
      }

      return "-";
    },
  },
  {
    id: "createdAt",
    header: "Date Created",
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.metadata?.createdAt
          ? getDateFormatDisplay(row.original.metadata.createdAt)
          : "-"}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "",
    size: 180,
    cell: ({ row }) => {
      const attorney = row.original;
      const isBanned = attorney?.metadata?.banned;

      return (
        <Group justify="center" gap={2} wrap="nowrap">
          {!isBanned && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red.7"
              onClick={() => onBanToggleClick(attorney)}
            >
              <IconBan size={18} />
            </ActionIcon>
          )}

          {isBanned && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="green.7"
              onClick={() => onBanToggleClick(attorney)}
            >
              <IconRestore size={18} />
            </ActionIcon>
          )}

          <ActionIcon
            size="sm"
            variant="subtle"
            color="#D4AF37"
            onClick={() => onUpdateClick(attorney)}
          >
            <IconPencil size={18} />
          </ActionIcon>

          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => onDeleteClick(attorney)}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      );
    },
  },
];
