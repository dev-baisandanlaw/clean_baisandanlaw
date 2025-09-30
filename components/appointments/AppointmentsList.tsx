import { Booking } from "@/types/booking";
import {
  ActionIcon,
  Badge,
  Group,
  Table,
  TableScrollContainer,
} from "@mantine/core";
import EmptyTableComponent from "../EmptyTableComponent";
import dayjs from "dayjs";
import { getBookingViaColor } from "@/utils/getBookingStatusColor";
import { IconEye, IconPencil, IconPennantOff } from "@tabler/icons-react";

interface AppointmentsListProps {
  data: Booking[];
  isLoading: boolean;
  selectedDate: string | null;
  handleSelectBooking: (
    booking: Booking,
    mode: "update" | "delete" | "view"
  ) => void;
}

export default function AppointmentsList({
  data,
  isLoading,
  selectedDate,
  handleSelectBooking,
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
            <Table.Th>Via</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
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
                  <Table.Td>{booking.attorney?.fullname || "-"}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="xs"
                      radius="xs"
                      color={getBookingViaColor(booking.via)}
                    >
                      {booking.via}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => handleSelectBooking(booking, "view")}
                      >
                        <IconEye />
                      </ActionIcon>

                      {!dayjs().isAfter(
                        dayjs(`${booking.date} ${booking.time}`)
                      ) && (
                        <ActionIcon
                          size="sm"
                          color="yellow"
                          variant="subtle"
                          onClick={() => handleSelectBooking(booking, "update")}
                        >
                          <IconPencil />
                        </ActionIcon>
                      )}

                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => handleSelectBooking(booking, "delete")}
                      >
                        <IconPennantOff />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
        </Table.Tbody>
      </Table>
    </TableScrollContainer>
  );
}
