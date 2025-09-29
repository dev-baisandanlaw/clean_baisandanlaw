import { Booking } from "@/types/booking";
import {
  ActionIcon,
  Badge,
  LoadingOverlay,
  Table,
  TableScrollContainer,
} from "@mantine/core";
import EmptyTableComponent from "../EmptyTableComponent";
import dayjs from "dayjs";
import { getBookingViaColor } from "@/utils/getBookingStatusColor";
import { IconCopyOff } from "@tabler/icons-react";

interface AppointmentsListProps {
  data: Booking[];
  isLoading: boolean;
  selectedDate: string | null;
}

export default function AppointmentsList({
  data,
  isLoading,
  selectedDate,
}: AppointmentsListProps) {
  const todayAppointments = data.filter(
    (booking) => booking.date === selectedDate
  );

  return (
    <TableScrollContainer
      minWidth={500}
      h="calc(100vh - 420px)"
      pos="relative"
      w="100%"
    >
      <Table stickyHeader stickyHeaderOffset={0} verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Time</Table.Th>
            <Table.Th>Client</Table.Th>
            <Table.Th>Attorney</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Via</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {isLoading && (
            <Table.Tr>
              <Table.Td colSpan={7}>
                <LoadingOverlay visible />
              </Table.Td>
            </Table.Tr>
          )}

          {!isLoading && todayAppointments.length === 0 && (
            <EmptyTableComponent colspan={7} />
          )}

          {!isLoading &&
            todayAppointments.length > 0 &&
            data
              .filter(
                (booking) =>
                  booking.date === dayjs(selectedDate!).format("YYYY-MM-DD")
              )
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>
                    {dayjs(`${booking.date} ${booking.time}`).format("h:mm A")}
                  </Table.Td>
                  <Table.Td>{booking.client.fullname}</Table.Td>
                  <Table.Td>-</Table.Td>
                  <Table.Td>-</Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      radius="xs"
                      color={getBookingViaColor(booking.via)}
                    >
                      {booking.via}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
        </Table.Tbody>
      </Table>
    </TableScrollContainer>
  );
}
