import { Booking } from "@/types/booking";
import { ActionIcon, Group, Text } from "@mantine/core";
import { BookingViaBadge, PaymentBadge } from "../Common/BadgeComp";
import dayjs from "dayjs";
import DataTableNoPagination from "../data-table/DataTableNoPagination";
import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import TableUserField from "../Common/TableUserField";
import {
  IconEye,
  IconPencil,
  IconPointer2,
  IconTrash,
} from "@tabler/icons-react";

interface AppointmentsListProps {
  data: Booking[];
  isLoading: boolean;
  selectedDate: string | null;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onViewReceipt: (booking: Booking) => void;
  userRole?: string;
}

export default function AppointmentsList({
  data,
  isLoading,
  selectedDate,
  onView,
  onEdit,
  onDelete,
  onViewReceipt,
  userRole,
}: AppointmentsListProps) {
  const appointments = useMemo(
    () =>
      data
        .filter((booking) => booking.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [data, selectedDate],
  );

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) =>
          dayjs(`${row.original.date} ${row.original.time}`).format("h:mm A"),
      },
      {
        accessorKey: "clientDetails",
        header: "Client",
        cell: ({ row }) => (
          <TableUserField
            title={row.original.clientDetails.fullname}
            subTitle={row.original.clientDetails.email}
          />
        ),
      },
      {
        accessorKey: "attorneyDetails",
        header: "Attorney",
        cell: ({ row }) => row.original.attorneyDetails?.fullname || "-",
      },
      {
        accessorKey: "paymentFields",
        header: "Payment",
        cell: ({ row }) => (
          <Group gap="xs" align="center" wrap="nowrap">
            <PaymentBadge
              hasReceiptUploaded={!!row.original.paymentFields?.fileId}
              isPaid={!!row.original.paymentFields?.isApproved}
            />
            {row.original.paymentFields?.fileId && (
              <ActionIcon
                size="xs"
                variant="default"
                onClick={() => onViewReceipt(row.original)}
              >
                <IconEye size={12} />
              </ActionIcon>
            )}
          </Group>
        ),
      },
      {
        accessorKey: "via",
        header: "Via",
        cell: ({ row }) => <BookingViaBadge via={row.original.via} />,
      },
      {
        accessorKey: "consultationMode",
        header: "Consultation",
        cell: ({ row }) => (
          <Text size="sm">
            {row.original.consultationMode === "in-person"
              ? row.original.branch || "-"
              : row.original.consultationMode === "online"
                ? "Online"
                : "-"}
          </Text>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 80,
        cell: ({ row }) => (
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => onView(row.original)}
            >
              <IconPointer2 size={18} style={{ rotate: "90deg" }} />
            </ActionIcon>

            {userRole === "admin" && (
              <>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => onEdit(row.original)}
                  color="yellow"
                >
                  <IconPencil size={18} />
                </ActionIcon>

                <ActionIcon
                  size="sm"
                  variant="subtle"
                  c="red"
                  onClick={() => onDelete(row.original)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </>
            )}
          </Group>
        ),
      },
    ],
    [onDelete, onEdit, onView, onViewReceipt, userRole],
  );

  return (
    <DataTableNoPagination
      columns={columns}
      data={isLoading ? [] : appointments}
      emptyText={
        isLoading ? "Loading appointments..." : "No appointments found."
      }
      maxHeight="calc(100vh - 420px)"
    />
  );
}
