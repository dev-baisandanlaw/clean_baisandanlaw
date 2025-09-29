import { NotaryRequest } from "@/types/notary-requests";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { getNotaryStatus, getNotaryStatusColor } from "@/utils/getNotaryStatus";
import { getNotaryTimelineBullet } from "@/utils/getNotaryTimelineBullet";
import {
  Alert,
  Divider,
  Drawer,
  Group,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
} from "@mantine/core";

interface ViewNotaryRequestDrawerProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export const ViewNotaryRequestDrawer = ({
  opened,
  onClose,
  notaryRequest,
}: ViewNotaryRequestDrawerProps) => {
  if (!notaryRequest) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Text c="green" fw={600}>
            Notary Request
          </Text>
          {getNotaryStatus(notaryRequest.status)}
        </Group>
      }
      styles={{ header: { width: "100%" } }}
      position="right"
      size="lg"
    >
      <Stack>
        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Requestor</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.fullname}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.email}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Uploaded At</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {getDateFormatDisplay(notaryRequest?.createdAt || "", true)}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th colSpan={2}>
                <Text c="green" fw={600} size="sm" ta="center">
                  Description
                </Text>
              </Table.Th>
            </Table.Tr>

            <Table.Tr>
              <Table.Td colSpan={2}>{notaryRequest?.description}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Divider my="lg" />

        {notaryRequest.timeline && notaryRequest.timeline.length > 0 && (
          <Timeline
            bulletSize={24}
            lineWidth={2}
            styles={{
              itemTitle: { fontSize: 14 },
              itemBullet: { background: "transparent", border: "none" },
            }}
          >
            {notaryRequest.timeline
              .sort((a, b) => b.dateAndTime.localeCompare(a.dateAndTime))
              .map((item) => (
                <Timeline.Item
                  key={item.id}
                  bullet={getNotaryTimelineBullet(item.status)}
                  styles={{
                    itemBullet: {
                      background: getNotaryStatusColor(item.status),
                    },
                  }}
                >
                  <Alert
                    color={getNotaryStatusColor(item.status)}
                    p="xs"
                    mb="2"
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Title order={6} c={getNotaryStatusColor(item.status)}>
                          {item.title}
                        </Title>

                        <Text size="xs">
                          by:{" "}
                          <Text span c="green" fw={700}>
                            {item.user.fullname}
                          </Text>
                        </Text>
                      </Group>

                      <Text size="xs" c="black">
                        {item.description}
                      </Text>

                      {item.reason && (
                        <Text size="xs" c="black">
                          <strong>Remarks:</strong> {item.reason}
                        </Text>
                      )}
                    </Stack>
                  </Alert>

                  <Text size="xs" ta="right">
                    {getDateFormatDisplay(item.dateAndTime, true)}
                  </Text>
                </Timeline.Item>
              ))}
          </Timeline>
        )}
      </Stack>
    </Drawer>
  );
};
