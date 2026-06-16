import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Text } from "@mantine/core";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "@/components/Common/BadgeComp";
import { IconEye } from "@tabler/icons-react";
import TableUserField from "@/components/Common/TableUserField";
import { UserReference } from "@/types/user-reference";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AttorneyRow = UserReference & { metadata: any };

export const attorneyColumns: ColumnDef<AttorneyRow>[] = [
  {
    accessorKey: "fullname",
    header: "Name",
    size: 250,
    cell: ({ row }) => (
      <Text size="sm" fw={600} c="green">
        {row.original.fullname ?? "-"}
      </Text>
    ),
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const { email, phone } = row.original;

      return <TableUserField title={email || "-"} subTitle={phone} />;
    },
  },
  {
    accessorKey: "metadata",
    header: "Practice Area",
    size: 300,
    cell: ({ row }) => {
      const metadata = row.original.metadata;
      if (metadata?.practiceAreas && metadata?.practiceAreas?.length > 0) {
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
    size: 80,
    cell: ({ row }) => (
      <Group justify="center">
        <ActionIcon
          size="sm"
          variant="subtle"
          component="a"
          href={`/matters/${row.original.id}`}
        >
          <IconEye size={24} />
        </ActionIcon>
      </Group>
    ),
  },
];
