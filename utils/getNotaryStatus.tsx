import {
  NotaryRequestLabel,
  NotaryRequestStatus,
} from "@/types/notary-requests";
import { Badge } from "@mantine/core";

export const notaryStatusColors = {
  [NotaryRequestStatus.SUBMITTED]: "#D4AF37",
  [NotaryRequestStatus.NEEDS_CLIENT_REVISION]: "#FF6347",
  [NotaryRequestStatus.PAYMENT_PENDING]: "#FF8C00",
  [NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION]: "#DAA520",
  [NotaryRequestStatus.PROCESSING]: "#1E90FF",
  [NotaryRequestStatus.FOR_CLIENT_REVIEW]: "#FF8C00",
  [NotaryRequestStatus.NEEDS_ATTORNEY_REVISION]: "#FF6347",
  [NotaryRequestStatus.CLIENT_APPROVED]: "#32CD32",
  [NotaryRequestStatus.COMPLETED]: "#228B22",
  [NotaryRequestStatus.CANCELLED]: "#696969",
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
