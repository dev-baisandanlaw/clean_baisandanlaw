import {
  ClientRequestBadge,
  getClientRequestStatusColor,
  PaymentBadge,
} from "@/components/Common/BadgeComp";
import TableUserField from "@/components/Common/TableUserField";
import { type ClientRequestListingItem } from "@/store/service-types/type-client-request-service";
import { type ClientRequestActionKey } from "@/types/clientRequest";
import { formatFee } from "@/utils/formatFee";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { ActionIcon, Group, Menu, Stack, Text } from "@mantine/core";
import {
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconEye,
  IconFileUpload,
  IconFlagCheck,
  IconForbid,
  IconPointer2,
  IconRefresh,
  IconReportMoney,
  IconScan,
  IconTimelineEvent,
} from "@tabler/icons-react";
import { type ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

const getPickupDateTimeDisplay = (row: ClientRequestListingItem) => {
  if (!row.pickupDate) return "";

  const dateValue = row.pickupTime
    ? dayjs(`${row.pickupDate} ${row.pickupTime}`).format("YYYY-MM-DD HH:mm")
    : row.pickupDate;

  return getDateFormatDisplay(dateValue, !!row.pickupTime);
};

const clientRequestActionColors: Partial<
  Record<ClientRequestActionKey, string>
> = {
  edit_request: getClientRequestStatusColor("needs_client_revision"),
  review_request: getClientRequestStatusColor("submitted"),
  upload_payment: getClientRequestStatusColor("payment_pending"),
  upload_finished_document: getClientRequestStatusColor("processing"),
  review_document: getClientRequestStatusColor("for_client_review"),
  complete_request: getClientRequestStatusColor("completed"),
  cancel_request: getClientRequestStatusColor("cancelled"),
  process_again: getClientRequestStatusColor("processing"),
};

interface ClientRequestColumnHandlers {
  // general actions
  onView: (clientRequestId: string) => void;
  onEdit: (clientRequestId: string) => void;
  onTimeline: (clientRequestId: string) => void;
  onDownloadInitialFile: (fileId: string) => void;
  onDownloadFinishedFile: (fileId: string) => void;
  onViewReceipt: (
    clientRequestId: string,
    receiptFileId: string,
    isPaid: boolean,
  ) => void;

  // Specific actions
  onAdminAction: (clientRequestId: string) => void;
  onAdminUploadFinishedFile: (clientRequestId: string) => void;
  onAdminComplete: (clientRequestId: string) => void;
  onAdminCancel: (clientRequestId: string) => void;
  onAdminProcessAgain: (clientRequestId: string) => void;
  onClientPayment: (clientRequestId: string, fee: number) => void;
  onClientReviewAction: (clientRequestId: string) => void;
}

export const getClientRequestColumns = ({
  onView,
  onDownloadInitialFile,
  onDownloadFinishedFile,
  onViewReceipt,
  onTimeline,

  onEdit,
  onClientPayment,
  onAdminAction,
  onAdminUploadFinishedFile,
  onAdminComplete,
  onAdminCancel,
  onAdminProcessAgain,
  onClientReviewAction,
}: ClientRequestColumnHandlers): ColumnDef<ClientRequestListingItem>[] => [
  {
    accessorKey: "requestor",
    header: "Requestor",
    cell: ({ row }) => (
      <TableUserField
        title={row.original.requestor?.fullname || row.original.requestorEmail}
        subTitle={row.original.requestor?.email || row.original.requestorEmail}
      />
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 320,
    cell: ({ row }) => (
      <Text size="sm" lineClamp={2}>
        {row.original.description}
      </Text>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ClientRequestBadge status={row.original.status} />,
  },
  {
    accessorKey: "paymentStatus",
    header: "Fee",
    cell: ({ row }) => {
      const fee = row.original.fee;
      const receiptFileId = row.original.paymentStatus.receiptFileId;

      if (!fee) {
        return <Text size="sm">TBD</Text>;
      }

      return (
        <Stack gap={2}>
          <Text size="sm" fw={500} style={{ whiteSpace: "nowrap" }}>
            {formatFee(Number(fee))}
          </Text>
          <Group gap="xs" align="center" wrap="nowrap">
            <PaymentBadge
              hasReceiptUploaded={!!receiptFileId}
              isPaid={row.original.paymentStatus.isPaid}
            />
            {receiptFileId && (
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() =>
                  onViewReceipt(
                    row.original.id,
                    receiptFileId,
                    row.original.paymentStatus.isPaid,
                  )
                }
              >
                <IconEye size={12} />
              </ActionIcon>
            )}
          </Group>
        </Stack>
      );
    },
  },
  {
    accessorKey: "pickup",
    header: "Pickup",
    cell: ({ row }) => {
      const pickupDateTimeDisplay = getPickupDateTimeDisplay(row.original);

      return (
        <Stack gap={2}>
          <Text size="sm">{row.original.pickup || "-"}</Text>
          {row.original.pickupMethod === "pickup" && pickupDateTimeDisplay && (
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {pickupDateTimeDisplay}
            </Text>
          )}
        </Stack>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <Text size="sm" style={{ whiteSpace: "nowrap" }}>
        {getDateFormatDisplay(row.original.createdAt)}
      </Text>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => (
      <Text size="sm" style={{ whiteSpace: "nowrap" }}>
        {getDateFormatDisplay(row.original.updatedAt, true)}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const availableActions = row.original.actions;
      const hasActions = availableActions.length > 0;
      const getActionProps = (
        actionKey: ClientRequestListingItem["actions"][number]["key"],
      ) => {
        if (actionKey === "edit_request") {
          return {
            disabled: false,
            rightSection: <IconEdit size={14} />,
            onClick: () => onEdit(row.original.id),
          };
        }

        if (actionKey === "review_request") {
          return {
            disabled: false,
            rightSection: <IconScan size={14} />,
            onClick: () => onAdminAction(row.original.id),
          };
        }

        if (actionKey === "upload_payment" && row.original.fee) {
          return {
            disabled: false,
            rightSection: <IconReportMoney size={14} />,
            onClick: () =>
              onClientPayment(row.original.id, Number(row.original.fee)),
          };
        }

        if (actionKey === "upload_finished_document") {
          return {
            disabled: false,
            rightSection: <IconFileUpload size={14} />,
            onClick: () => onAdminUploadFinishedFile(row.original.id),
          };
        }

        if (actionKey === "review_document") {
          return {
            disabled: false,
            rightSection: <IconScan size={14} />,
            onClick: () => onClientReviewAction(row.original.id),
          };
        }

        if (actionKey === "complete_request") {
          return {
            disabled: false,
            rightSection: <IconFlagCheck size={14} />,
            onClick: () => onAdminComplete(row.original.id),
          };
        }

        if (actionKey === "cancel_request") {
          return {
            disabled: false,
            rightSection: <IconForbid size={14} />,
            onClick: () => onAdminCancel(row.original.id),
          };
        }

        if (actionKey === "process_again") {
          return {
            disabled: false,
            rightSection: <IconRefresh size={14} />,
            onClick: () => onAdminProcessAgain(row.original.id),
          };
        }

        return {
          disabled: true,
          rightSection: undefined,
          onClick: undefined,
        };
      };

      return (
        <Group justify="center">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="black" size="sm">
                <IconDotsVertical />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>General</Menu.Label>
              <Menu.Item
                rightSection={
                  <IconPointer2 size={14} style={{ rotate: "90deg" }} />
                }
                onClick={() => onView(row.original.id)}
              >
                View Details
              </Menu.Item>
              <Menu.Item
                rightSection={<IconTimelineEvent size={14} />}
                onClick={() => onTimeline(row.original.id)}
              >
                Timeline
              </Menu.Item>
              <Menu.Item
                disabled={!row.original.initialFileId}
                rightSection={<IconDownload size={14} />}
                onClick={() => {
                  if (!row.original.initialFileId) return;

                  onDownloadInitialFile(row.original.initialFileId);
                }}
              >
                Initial File
              </Menu.Item>
              <Menu.Item
                disabled={!row.original.finishedFileId}
                rightSection={<IconDownload size={14} />}
                onClick={() => {
                  if (!row.original.finishedFileId) return;

                  onDownloadFinishedFile(row.original.finishedFileId);
                }}
              >
                Finished File
              </Menu.Item>

              {hasActions && (
                <>
                  <Menu.Label>Actions</Menu.Label>

                  {availableActions.map((action) => {
                    const actionProps = getActionProps(action.key);

                    return (
                      <Menu.Item
                        key={action.key}
                        color={
                          clientRequestActionColors[action.key] ?? action.color
                        }
                        disabled={actionProps.disabled}
                        rightSection={actionProps.rightSection}
                        onClick={actionProps.onClick}
                      >
                        {action.label}
                      </Menu.Item>
                    );
                  })}
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      );
    },
  },
];
