import { Badge, useMantineTheme } from "@mantine/core";
import {
  NotaryRequestLabel,
  NotaryRequestStatus,
} from "@/types/notary-requests";

const notaryStatusColors = {
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

const getNotaryStatusColor = (status: NotaryRequestStatus): string => {
  return notaryStatusColors[status] || "gray";
};

const AreaBadge = ({ area }: { area: string }) => {
  const theme = useMantineTheme();

  return (
    <Badge
      size="xs"
      radius="xs"
      variant="outline"
      color={theme.other.customPumpkin}
    >
      {area}
    </Badge>
  );
};

const PaymentBadge = ({
  isPaid,
  hasReceiptUploaded,
}: {
  isPaid: boolean;
  hasReceiptUploaded: boolean;
}) => {
  return (
    <Badge
      size="xs"
      radius="xs"
      variant="outline"
      color={isPaid ? "green" : hasReceiptUploaded ? "yellow" : "red"}
    >
      {isPaid ? "Paid" : hasReceiptUploaded ? "For Approval" : "Unpaid"}
    </Badge>
  );
};

const BookingViaBadge = ({ via }: { via: string }) => {
  const color = () => {
    switch (via) {
      case "Website":
        return "green";
      case "Phone Call":
        return "teal";
      case "Email":
        return "cyan";
      case "Walk-in":
        return "purple";
      case "Facebook":
        return "yellow";
      case "Referral":
        return "orange";
      default:
        return "blue";
    }
  };

  return (
    <Badge size="xs" radius="xs" color={color()} variant="dot">
      {via}
    </Badge>
  );
};

const NotaryStatusBadge = ({ status }: { status: NotaryRequestStatus }) => {
  const color = getNotaryStatusColor(status);

  return (
    <Badge size="xs" radius="xs" color={color} variant="light">
      {NotaryRequestLabel[status]}
    </Badge>
  );
};

export {
  AreaBadge,
  PaymentBadge,
  BookingViaBadge,
  NotaryStatusBadge,
  getNotaryStatusColor,
  notaryStatusColors,
};
