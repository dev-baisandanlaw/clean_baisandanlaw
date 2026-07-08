import { ScrollArea, Text, Timeline } from "@mantine/core";
import BasicCard from "../BasicCard";
import { Update } from "@/types/updates";
import {
  IconCalendar,
  IconChecklist,
  IconFile,
  IconStack,
} from "@tabler/icons-react";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";

const getBulletDisplay = (
  type: "detail" | "document" | "task" | "schedule",
) => {
  switch (type) {
    case "detail":
      return <IconStack size={12} />;

    case "document":
      return <IconFile size={12} />;

    case "task":
      return <IconChecklist size={12} />;

    case "schedule":
      return <IconCalendar size={12} />;

    default:
      return null;
  }
};

export default function UpdatesSection({ updates }: { updates: Update[] }) {
  return (
    <BasicCard
      bodyProps={{ pb: 0, mah: 320 }}
      title="Recent Activity"
      containerProps={{ w: "100%" }}
    >
      <ScrollArea.Autosize mah={300} offsetScrollbars>
        <Timeline active={updates.length + 1} bulletSize={16} lineWidth={2}>
          {updates
            .map((update) => (
              <Timeline.Item
                key={update.id}
                bullet={getBulletDisplay(update.type)}
                title={update.description}
                styles={{ itemTitle: { fontSize: "14px" } }}
              >
                <Text size="xs" c="dimmed">
                  {getDateFormatDisplay(update.createdAt, true)}
                </Text>
              </Timeline.Item>
            ))
            .reverse()}
        </Timeline>
      </ScrollArea.Autosize>
    </BasicCard>
  );
}
