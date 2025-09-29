import { TaskStatus } from "@/types/task";
import { Badge } from "@mantine/core";

export const getMatterStatus = (status: TaskStatus) => {
  let color = "gray";

  if (status === TaskStatus.Pending) color = "#D4AF37";
  if (status === TaskStatus.Completed) color = "green";

  return (
    <Badge size="xs" radius="xs" color={color} variant="filled">
      {status}
    </Badge>
  );
};
