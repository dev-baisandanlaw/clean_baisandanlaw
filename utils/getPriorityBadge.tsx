import { Badge } from "@mantine/core";

export const getPriorityBadge = (priority: string) => {
  let color = "gray";

  if (priority === "medium") {
    color = "orange";
  }

  if (priority === "high") {
    color = "red";
  }

  if (priority === "low") {
    color = "green";
  }

  return (
    <Badge size="xs" radius="xs" color={color} variant="light">
      {priority}
    </Badge>
  );
};
