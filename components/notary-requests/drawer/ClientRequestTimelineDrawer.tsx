import { ClientRequestBadge } from "@/components/Common/BadgeComp";
import AppDrawer from "@/components/Common/drawer/AppDrawer";
import { useGetClientRequestTimelineQuery } from "@/store/services/clientRequestService";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import {
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Timeline,
  useMantineTheme,
} from "@mantine/core";

interface ClientRequestTimelineDrawerProps {
  opened: boolean;
  onClose: () => void;
  clientRequestId: string | null;
}

export default function ClientRequestTimelineDrawer({
  opened,
  onClose,
  clientRequestId,
}: ClientRequestTimelineDrawerProps) {
  const theme = useMantineTheme();

  const {
    data: timeline,
    isLoading,
    isFetching,
  } = useGetClientRequestTimelineQuery(clientRequestId ?? "", {
    skip: !opened || !clientRequestId,
  });

  return (
    <AppDrawer opened={opened} onClose={onClose} title="Timeline">
      {(isLoading || isFetching) && (
        <Center h={200}>
          <Loader />
        </Center>
      )}

      {!isLoading &&
        !isFetching &&
        timeline &&
        timeline?.data?.length === 0 && (
          <Center h={200}>
            <Text>No timeline events found.</Text>
          </Center>
        )}

      {!isLoading && !isFetching && timeline && timeline?.data?.length > 0 && (
        <Timeline
          active={timeline.data.length + 1}
          bulletSize={16}
          lineWidth={2}
          styles={{
            item: {
              "--item-border-color": theme.colors.green[8],
            },
          }}
        >
          {timeline.data
            .map((event) => (
              <Timeline.Item
                key={event.id}
                title={
                  <Group justify="space-between">
                    <Text fw={600} flex={1} size="sm">
                      {event.description}
                    </Text>
                    <div style={{ flexShrink: 0 }}>
                      <ClientRequestBadge status={event.status} />
                    </div>
                  </Group>
                }
              >
                {event.remarks && (
                  <Paper withBorder py={4} px={6}>
                    <Stack gap={4}>
                      <Text size="sm" c="dimmed">
                        Remarks:
                      </Text>

                      <Text size="sm">{event.remarks}</Text>
                    </Stack>
                  </Paper>
                )}
                <Group gap={4} mt={4}>
                  <Text size="xs" c="dimmed">
                    {event.createdBy?.fullname} •
                  </Text>
                  <Text size="xs" c="dimmed">
                    {getDateFormatDisplay(event.createdAt, true)}
                  </Text>
                </Group>
              </Timeline.Item>
            ))
            .reverse()}
        </Timeline>
      )}
    </AppDrawer>
  );
}
