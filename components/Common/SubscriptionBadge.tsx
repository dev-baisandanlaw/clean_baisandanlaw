import { Badge } from "@mantine/core";
import { IconPackage, IconStarFilled } from "@tabler/icons-react";
import { useMantineTheme } from "@mantine/core";

export default function SubscriptionBadge({
  isSubscribed,
  compact = false,
}: {
  isSubscribed: boolean;
  compact?: boolean;
}) {
  const theme = useMantineTheme();
  return (
    <Badge
      variant="light"
      size={compact ? "xs" : "md"}
      radius="xs"
      color={isSubscribed ? theme.colors.green[4] : theme.colors.gray[9]}
      leftSection={
        isSubscribed ? <IconStarFilled size={12} /> : <IconPackage size={12} />
      }
    >
      {isSubscribed ? "Premium" : "Basic"}
    </Badge>
  );
}
