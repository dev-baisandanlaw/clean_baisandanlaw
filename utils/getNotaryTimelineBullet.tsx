import { NotaryRequestStatus } from "@/types/notary-requests";
import {
  IconFileUpload,
  IconUserCheck,
  IconCheck,
  IconX,
  IconCircleCheck,
  IconBan,
  IconTools,
  IconCash,
  IconCreditCardPay,
  IconEdit,
} from "@tabler/icons-react";

export const getNotaryTimelineBullet = (status: NotaryRequestStatus) => {
  switch (status) {
    case NotaryRequestStatus.SUBMITTED:
      return <IconFileUpload size={12} />;
    case NotaryRequestStatus.NEEDS_CLIENT_REVISION:
      return <IconEdit size={12} />;
    case NotaryRequestStatus.PAYMENT_PENDING:
      return <IconCash size={12} />;
    case NotaryRequestStatus.FOR_ADMIN_PAYMENT_VERIFICATION:
      return <IconCreditCardPay size={12} />;
    case NotaryRequestStatus.PROCESSING:
      return <IconTools size={12} />;
    case NotaryRequestStatus.FOR_CLIENT_REVIEW:
      return <IconUserCheck size={12} />;
    case NotaryRequestStatus.NEEDS_ATTORNEY_REVISION:
      return <IconX size={12} />;
    case NotaryRequestStatus.CLIENT_APPROVED:
      return <IconCheck size={12} />;
    case NotaryRequestStatus.COMPLETED:
      return <IconCircleCheck size={12} />;
    case NotaryRequestStatus.CANCELLED:
      return <IconBan size={12} />;
    default:
      return <IconFileUpload size={12} />;
  }
};
