import {
  Button,
  Card,
  Group,
  Notification,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import getUpdateIcon from "./getUpdateIcon";
import { MatterUpdate } from "@/types/matter-updates";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { useDisclosure } from "@mantine/hooks";
import ViewAllModal from "../modals/ViewAllModal";

interface MatterUpdatesProps {
  updates: MatterUpdate[] | [];
}

export default function MatterUpdates({ updates }: MatterUpdatesProps) {
  const [viewAllModal, { open: openViewAllModal, close: closeViewAllModal }] =
    useDisclosure(false);

  return (
    <>
      <ViewAllModal
        opened={viewAllModal}
        onClose={closeViewAllModal}
        title="All Updates"
      >
        <Stack>
          {updates
            .sort(
              (a, b) =>
                new Date(b.dateAndTime).getTime() -
                new Date(a.dateAndTime).getTime()
            )
            .map((update) => (
              <Notification
                key={update.id}
                icon={getUpdateIcon(update.type)}
                title={
                  <Text size="sm" c="green" fw={600}>
                    {getDateFormatDisplay(update.dateAndTime, true)}
                  </Text>
                }
                withCloseButton={false}
                withBorder
              >
                <Text size="sm" c="black">
                  <strong>
                    {update.updateDivision.charAt(0).toUpperCase() +
                      update.updateDivision.slice(1)}
                  </strong>
                  : {update.description}
                </Text>
              </Notification>
            ))}
        </Stack>
      </ViewAllModal>

      <Card withBorder radius="md" p="md">
        <Card.Section inheritPadding py="xs">
          <Group align="center" justify="space-between">
            <Text size="lg" fw={600} c="green">
              Activity
            </Text>

            <Button size="xs" variant="outline" onClick={openViewAllModal}>
              View All
            </Button>
          </Group>
        </Card.Section>

        <ScrollArea mah={502} style={{ overflowY: "hidden" }}>
          <Stack>
            {updates
              ?.sort(
                (a, b) =>
                  new Date(b.dateAndTime).getTime() -
                  new Date(a.dateAndTime).getTime()
              )
              .map((update, index) => (
                <Notification
                  key={index}
                  icon={getUpdateIcon(update.type)}
                  title={
                    <Text size="sm" c="green" fw={600}>
                      {getDateFormatDisplay(update.dateAndTime, true)}
                    </Text>
                  }
                  withCloseButton={false}
                  withBorder
                >
                  <Text size="sm" c="black">
                    <strong>
                      {update.updateDivision.charAt(0).toUpperCase() +
                        update.updateDivision.slice(1)}
                    </strong>
                    : {update.description}
                  </Text>
                </Notification>
              ))}
          </Stack>
        </ScrollArea>
      </Card>
    </>
  );
}
