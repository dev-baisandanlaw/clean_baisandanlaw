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
import { IconMail, IconPhone } from "@tabler/icons-react";

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="View Appointment"
      centered
      size="lg"
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
                    ({booking.client.email})
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconPhone size={16} />
                  <Text c="green" fw={600} size="sm">
                    ({booking.client.phoneNumber || "-"})
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
            <Table.Th w={160}>Date & Time</Table.Th>
            <Table.Td>
              <Text c="green" fw={600} size="sm">
                {getDateFormatDisplay(`${booking.date} ${booking.time}`, true)}
              </Text>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={160}>Via</Table.Th>
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
              <Text c="green" fw={600} size="sm">
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
