import { type ColumnDef } from "@tanstack/react-table";
import { Button, Group, Text } from "@mantine/core";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { IconArrowBadgeDown, IconArrowBadgeUp } from "@tabler/icons-react";
import TableUserField from "@/components/Common/TableUserField";
import { UserReference } from "@/types/user-reference";
import dayjs from "dayjs";
import SubscriptionBadge from "@/components/Common/SubscriptionBadge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClientRow = UserReference & { metadata: any };

export const createClientColumns = (
  onActionClick: (client: ClientRow) => void,
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
      const subscription = row.original.metadata.subscription;
      const subscriptionEndDate = subscription?.subscribedEndDate;

      const isSubscribed =
        subscriptionEndDate &&
        dayjs(subscriptionEndDate).endOf("day").isAfter(dayjs());

      return (
        <Group justify="center">
          <Button
            size="compact-sm"
            color={isSubscribed ? "red" : "green"}
            onClick={() => onActionClick(row.original)}
            variant="filled"
            leftSection={
              isSubscribed ? (
                <IconArrowBadgeDown size={16} />
              ) : (
                <IconArrowBadgeUp size={16} />
              )
            }
            styles={{ label: { fontSize: "12px", marginLeft: -8 } }}
          >
            {isSubscribed ? "Cancel" : "Upgrade"}
          </Button>
        </Group>
      );
    },
  },
];
