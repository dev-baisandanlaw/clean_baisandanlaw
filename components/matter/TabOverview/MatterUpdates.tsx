import { Card, Notification, ScrollArea, Stack, Text } from "@mantine/core";
import getUpdateIcon from "./getUpdateIcon";
import { MatterUpdate } from "@/types/matter-updates";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";

interface MatterUpdatesProps {
  updates: MatterUpdate[] | [];
}

export default function MatterUpdates({ updates }: MatterUpdatesProps) {
  return (
    <Card withBorder radius="md" p="md">
      <Card.Section inheritPadding py="xs">
        <Text size="lg" fw={600} c="green">
          Updates
        </Text>
      </Card.Section>

      <ScrollArea.Autosize mah={500} offsetScrollbars>
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
      </ScrollArea.Autosize>
    </Card>
  );
}
