import { type ColumnDef } from "@tanstack/react-table";
import { ActionIcon, Group, Text } from "@mantine/core";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  IconChevronsDown,
  IconChevronsUp,
  IconTrash,
} from "@tabler/icons-react";
import TableUserField from "@/components/Common/TableUserField";
import { UserReference } from "@/types/user-reference";
import dayjs from "dayjs";
import SubscriptionBadge from "@/components/Common/SubscriptionBadge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientRow = UserReference & { metadata: any };

export const createClientColumns = (
  onActionClick: (client: ClientRow) => void,
  onDeleteClick: (client: ClientRow) => void,
): ColumnDef<ClientRow>[] => [
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
    id: "createdAt",
    header: "Membership Date",
    cell: ({ row }) => (
      <Text size="sm">
        {row.original.metadata?.createdAt
          ? getDateFormatDisplay(row.original.metadata.createdAt)
          : "-"}
      </Text>
    ),
  },
  {
    id: "metadata",
    header: "Subscription",
    cell: ({ row }) => {
      const subscription = row.original.metadata.subscription;
      const subscriptionEndDate = subscription?.subscribedEndDate;

      const isSubscribed =
        subscriptionEndDate &&
        dayjs(subscriptionEndDate).endOf("day").isAfter(dayjs());

      return <SubscriptionBadge isSubscribed={isSubscribed || false} />;
    },
  },
  {
    id: "actions",
    header: "",
    size: 80,
    cell: ({ row }) => {
      const client = row.original;
      const subscription = client.metadata.subscription;
      const subscriptionEndDate = subscription?.subscribedEndDate;

      const isSubscribed =
        subscriptionEndDate &&
        dayjs(subscriptionEndDate).endOf("day").isAfter(dayjs());

      return (
        <Group justify="center" wrap="nowrap" gap={2}>
          {isSubscribed && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => onActionClick(client)}
            >
              <IconChevronsDown size={24} />
            </ActionIcon>
          )}

          {!isSubscribed && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="green"
              onClick={() => onActionClick(client)}
            >
              <IconChevronsUp size={24} />
            </ActionIcon>
          )}

          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => onDeleteClick(client)}
          >
            <IconTrash size={24} />
          </ActionIcon>
        </Group>
      );
    },
  },
];
