import {
  NotaryRequestLabel,
  NotaryRequestStatus,
} from "@/types/notary-requests";
import { Badge } from "@mantine/core";

export const notaryStatusColors = {
  [NotaryRequestStatus.SUBMITTED]: "#D4AF37", // Gold
  [NotaryRequestStatus.PROCESSING]: "#1E90FF", // Dodger Blue
  [NotaryRequestStatus.FOR_CLIENT_REVIEW]: "#FF8C00", // Dark Orange
  [NotaryRequestStatus.CLIENT_APPROVED]: "#32CD32", // Lime Green
  [NotaryRequestStatus.REJECTED]: "#DC143C", // Crimson
  [NotaryRequestStatus.CLIENT_REJECTED]: "#DC143C", // Crimson
  [NotaryRequestStatus.COMPLETED]: "#228B22", // Forest Green
  [NotaryRequestStatus.FOR_PICKUP]: "#9370DB", // Medium Purple
  [NotaryRequestStatus.CANCELLED]: "#696969", // Dim Gray
} as const;

export const getNotaryStatusColor = (status: NotaryRequestStatus): string => {
  return notaryStatusColors[status] || "gray";
};

export const getNotaryStatus = (status: NotaryRequestStatus) => {
  const color = getNotaryStatusColor(status);

  return (
    <Badge size="xs" radius="xs" color={color} variant="filled">
      {NotaryRequestLabel[status]}
    </Badge>
  );
};
