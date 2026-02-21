import { Booking } from "@/types/booking";
import { getBookingViaColor } from "@/utils/getBookingStatusColor";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconCake, IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";
import dayjs from "dayjs";

type ViewAppointmentModalProps = {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
};

export default function ViewAppointmentModal({
  opened,
  onClose,
  booking,
}: ViewAppointmentModalProps) {
  const theme = useMantineTheme();

  if (!booking) return null;

  console.log(booking);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>View Appointment</Text>
          <Badge size="xs" radius="xs" color={getBookingViaColor(booking.via)}>
            {booking.via}
          </Badge>
        </Group>
      }
      centered
      size="xl"
      transitionProps={{ transition: "pop" }}
    >
      <Table variant="vertical" layout="fixed">
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={160}>Client</Table.Th>
            <Table.Td>
              <Stack gap="0">
                <Text fw={600} mb="xs">
                  {booking.client.fullname}
                </Text>

                <Group gap="xs">
                  <IconMail size={16} />
                  <Text c="green" fw={600} size="sm">
                    {booking.client.email}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconPhone size={16} />
                  <Text c="green" fw={600} size="sm">
                    {booking.client.phoneNumber || "-"}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconCake size={16} />
                  <Text c="green" fw={600} size="sm">
                    {booking?.client?.birthday
                      ? dayjs(booking?.client?.birthday).format("MMM D, YYYY")
                      : "-"}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconMapPin size={16} />
                  <Text c="green" fw={600} size="sm">
                    {booking?.client?.fullAddress
                      ? booking?.client?.fullAddress
                      : "-"}
                  </Text>
                </Group>
              </Stack>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Attorney</Table.Th>
            <Table.Td>
              <Stack gap="0">
                <Text fw={600} mb="xs">
                  {booking.attorney?.fullname || "-"}
                </Text>

                {booking.attorney?.email && (
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text c="green" fw={600} size="sm">
                      ({booking.attorney?.email})
                    </Text>
                  </Group>
                )}
              </Stack>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Consultation Type</Table.Th>
            <Table.Td>
              <Stack gap="0">
                <Text c="green" fw={600} size="sm" tt="capitalize">
                  {booking?.consultationMode || "-"}
                </Text>
                {booking?.consultationMode && (
                  <Text size="xs" c="dimmed">
                    {booking?.consultationMode === "in-person"
                      ? booking?.branch || "-"
                      : ""}
                  </Text>
                )}
              </Stack>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Represented by Previous Lawyer</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm" tt="capitalize">
                {booking?.representedByPreviousLawyer ? "Yes" : "No"}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Date & Time</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {getDateFormatDisplay(`${booking.date} ${booking.time}`, true)}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Areas</Table.Th>
            <Table.Td>
              <Group gap="xs">
                {booking.areas?.map((area) => (
                  <Badge
                    key={area}
                    size="xs"
                    radius="xs"
                    variant="outline"
                    color={theme.other.customPumpkin}
                  >
                    {area}
                  </Badge>
                ))}
              </Group>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Description</Table.Th>
            <Table.Td>
              <Text
                c="green"
                fw={600}
                size="sm"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {booking.message}
              </Text>
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      <Button
        onClick={onClose}
        variant="outline"
        ml="auto"
        display="block"
        mt="md"
      >
        Close
      </Button>
    </Modal>
  );
}
