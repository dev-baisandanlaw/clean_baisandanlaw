import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { type MatterListingResponse } from "@/store/service-types/type-matter-service";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { AreaBadge } from "@/components/Common/BadgeComp";
import { IconEye } from "@tabler/icons-react";
import TableUserField from "@/components/Common/TableUserField";

type MatterRow = MatterListingResponse["data"][number];

export const matterColumns: ColumnDef<MatterRow>[] = [
  {
    accessorKey: "caseNumber",
    header: "Matter No.",
    size: 125,
    cell: ({ row }) => (
      <Tooltip
        label={row.original.caseNumber || "-"}
        withArrow
        multiline
        maw={300}
        position="top-start"
      >
        <Text size="sm" fw={500} c="green" truncate>
          {row.original.caseNumber ?? "-"}
        </Text>
      </Tooltip>
    ),
  },
  {
    accessorKey: "leadAttorney",
    header: "Attorney",
    cell: ({ row }) => {
      const { email, fullname } = row.original.leadAttorney;

      return <TableUserField title={fullname} subTitle={email} />;
    },
  },
  {
    accessorKey: "clientData",
    header: "Client",
    cell: ({ row }) => {
      const { email, fullname } = row.original.clientData;

      return <TableUserField title={fullname} subTitle={email} />;
    },
  },
  {
    accessorKey: "caseType",
    header: "Areas",
    size: 150,
    maxSize: 150,
    minSize: 150,
    cell: ({ row }) => (
      <Group gap={2} wrap="nowrap" style={{ overflow: "hidden" }}>
        {row.original.caseType?.length > 0 ? (
          row.original.caseType.map((a) => <AreaBadge area={a} key={a} />)
        ) : (
          <Text size="sm">-</Text>
        )}
      </Group>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.createdAt
          ? getDateFormatDisplay(row.original.createdAt)
          : "-"}
      </Text>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Update",
    cell: ({ row }) => (
      <Text size="sm" style={{ whiteSpace: "nowrap" }}>
        {row.original.createdAt
          ? getDateFormatDisplay(row.original.updatedAt, true)
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
