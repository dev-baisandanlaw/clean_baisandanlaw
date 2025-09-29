import { NotaryRequestStatus } from "@/types/notary-requests";
import {
  IconFileUpload,
  IconUserCheck,
  IconCheck,
  IconX,
  IconCircleCheck,
  IconPackage,
  IconBan,
  IconTools,
} from "@tabler/icons-react";

export const getNotaryTimelineBullet = (status: NotaryRequestStatus) => {
  switch (status) {
    case NotaryRequestStatus.SUBMITTED:
      return <IconFileUpload size={12} />;
    case NotaryRequestStatus.PROCESSING:
      return <IconTools size={12} />;
    case NotaryRequestStatus.FOR_CLIENT_REVIEW:
      return <IconUserCheck size={12} />;
    case NotaryRequestStatus.CLIENT_APPROVED:
      return <IconCheck size={12} />;
    case NotaryRequestStatus.REJECTED:
      return <IconX size={12} />;
    case NotaryRequestStatus.COMPLETED:
      return <IconCircleCheck size={12} />;
    case NotaryRequestStatus.FOR_PICKUP:
      return <IconPackage size={12} />;
    case NotaryRequestStatus.CANCELLED:
      return <IconBan size={12} />;
    default:
      return <IconFileUpload size={12} />;
  }
};
