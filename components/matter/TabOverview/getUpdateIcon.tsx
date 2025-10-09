import { MatterUpdateType } from "@/types/matter-updates";
import { ThemeIcon } from "@mantine/core";
import {
  IconCalendarWeek,
  IconChecklist,
  IconFileDescription,
  IconFolder,
  IconSettings,
} from "@tabler/icons-react";

const iconMap = {
  [MatterUpdateType.DOCUMENT]: IconFolder,
  [MatterUpdateType.TASK]: IconChecklist,
  [MatterUpdateType.SCHEDULE]: IconCalendarWeek,
  [MatterUpdateType.SYSTEM]: IconSettings,
  [MatterUpdateType.DESCRIPTION]: IconFileDescription,
};

export default function getUpdateIcon(update: MatterUpdateType) {
  const IconComponent = iconMap[update];

  return (
    <ThemeIcon color="green" radius="xl">
      <IconComponent size={16} />
    </ThemeIcon>
  );
}
