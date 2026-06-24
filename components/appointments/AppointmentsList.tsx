import { Booking } from "@/types/booking";
import DataTableNoPagination from "../data-table/DataTableNoPagination";
import { useMemo } from "react";
import {
  createAppointmentColumns,
} from "../data-table/columns-no-pagination/AppointmentColumns";

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

  const columns = useMemo(
    () =>
      createAppointmentColumns({
        onView,
        onEdit,
        onDelete,
        onViewReceipt,
        userRole,
      }),
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
