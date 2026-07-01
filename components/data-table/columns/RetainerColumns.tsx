import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Text } from "@mantine/core";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { IconBuilding, IconPointer2, IconUser } from "@tabler/icons-react";
import { type RetainerListingResponse } from "@/store/service-types/type-retainer-service";
import TableUserField from "@/components/Common/TableUserField";
import { AreaBadge } from "@/components/Common/BadgeComp";

type RetainerRow = RetainerListingResponse["data"][number];

export const retainerColumns: ColumnDef<RetainerRow>[] = [
  {
    accessorKey: "client",
    header: "Client",
    size: 200,
    cell: ({ row }) => {
      const { clientName, clientType } = row.original || {};

      return (
        <Group gap="sm" wrap="nowrap">
          {clientType === "individual" ? <IconUser /> : <IconBuilding />}
          <Text size="sm" fw={600} c="green">
            {clientName}
          </Text>
        </Group>
      );
    },
  },
  {
    accessorKey: "contactPerson",
    header: "Contact Person",
    size: 200,
    cell: ({ row }) => {
      const contactPerson = row.original.contactPerson;

      return (
        <TableUserField
          title={contactPerson.fullname}
          subTitle={contactPerson.email}
        />
      );
    },
  },
  {
    accessorKey: "areas",
    header: "Areas",
    size: 150,
    maxSize: 150,
    minSize: 150,
    cell: ({ row }) => (
      <Group gap={2} wrap="nowrap" style={{ overflow: "hidden" }}>
        {row.original.areas?.length > 0 ? (
          row.original.areas.map((a) => <AreaBadge area={a} key={a} />)
        ) : (
          <Text size="sm">-</Text>
        )}
      </Group>
    ),
  },
  {
    accessorKey: "retainerSince",
    header: "Retainer Since",
    cell: ({ row }) => getDateFormatDisplay(row.original.retainerSince),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Update",
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.updatedAt
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
          href={`/retainers/${row.original.id}`}
        >
          <IconPointer2 size={18} style={{ rotate: "90deg" }} />
        </ActionIcon>
      </Group>
    ),
  },
];
