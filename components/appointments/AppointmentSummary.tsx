import { Booking } from "@/types/booking";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { Card, Table, Text } from "@mantine/core";
import dayjs from "dayjs";

interface AppointmentSummaryProps {
  bookings: Booking[];
  currentDate: string;
  selectedDate: string | null;
}

export default function AppointmentSummary({
  bookings,
  currentDate,
  selectedDate,
}: AppointmentSummaryProps) {
  return (
    <Card withBorder radius="sm" p="md">
      <Card.Section inheritPadding py="xs">
        <Text size="lg" fw={600} c="green">
          Appointment Summary
        </Text>
      </Card.Section>

      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={240}>Month/Year</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {dayjs(currentDate).format("MMMM YYYY")}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={240}>Selected Date</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {getDateFormatDisplay(selectedDate || "")}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={240}>Monthly Appointments</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {bookings.length}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={240}>Today&apos;s Appointments</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {
                  bookings.filter((booking) => booking.date === selectedDate)
                    .length
                }
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Card>
  );
}
