import { Booking } from "@/types/booking";
import {
  ActionIcon,
  Group,
  Stack,
  Table,
  TableScrollContainer,
  Text,
} from "@mantine/core";
import { BookingViaBadge, PaymentBadge } from "../Common/BadgeComp";
import EmptyTableComponent from "../EmptyTableComponent";
import dayjs from "dayjs";
import { IconEye, IconPencil, IconPennant } from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

interface AppointmentsListProps {
  data: Booking[];
  isLoading: boolean;
  selectedDate: string | null;
  handleSelectBooking: (
    booking: Booking,
    mode: "update" | "delete" | "view" | "add" | "receipt",
  ) => void;
}

export default function AppointmentsList({
  data,
  isLoading,
  selectedDate,
  handleSelectBooking,
}: AppointmentsListProps) {
  const { user } = useUser();

  const todayAppointments = data.filter(
    (booking) => booking.date === selectedDate,
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
            <Table.Th>Payment</Table.Th>
            <Table.Th>Via</Table.Th>
            <Table.Th>Consultation</Table.Th>
            {user?.unsafeMetadata?.role === "admin" && (
              <Table.Th ta="center">Actions</Table.Th>
            )}
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
                  booking.date === dayjs(selectedDate!).format("YYYY-MM-DD"),
              )
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((booking) => (
                <Table.Tr key={booking.id}>
                  <Table.Td>
                    {dayjs(`${booking.date} ${booking.time}`).format("h:mm A")}
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="2">
                      <Text size="sm" fw={600}>
                        {booking.client.fullname}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {booking.client.email}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>{booking.attorney?.fullname || "-"}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" align="center" wrap="nowrap">
                      <PaymentBadge
                        hasReceiptUploaded={
                          !!booking?.paymentFields?.receiptFileId
                        }
                        isPaid={booking?.paymentFields?.isPaid}
                      />
                      {booking?.paymentFields?.receiptFileId && (
                        <ActionIcon
                          size="xs"
                          variant="default"
                          onClick={() =>
                            handleSelectBooking(booking, "receipt")
                          }
                        >
                          <IconEye size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <BookingViaBadge via={booking.via} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {booking?.consultationMode === "in-person"
                        ? booking?.branch || "-"
                        : booking?.consultationMode === "online"
                          ? "Online"
                          : "-"}
                    </Text>
                  </Table.Td>
                  {user?.unsafeMetadata?.role === "admin" && (
                    <Table.Td ta="center">
                      <Group gap={6} justify="center">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => handleSelectBooking(booking, "view")}
                        >
                          <IconEye />
                        </ActionIcon>

                        {!dayjs().isAfter(
                          dayjs(`${booking.date} ${booking.time}`),
                        ) && (
                          <ActionIcon
                            size="sm"
                            color="yellow"
                            variant="subtle"
                            onClick={() =>
                              handleSelectBooking(booking, "update")
                            }
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
                          <IconPennant />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
        </Table.Tbody>
      </Table>
    </TableScrollContainer>
  );
}
