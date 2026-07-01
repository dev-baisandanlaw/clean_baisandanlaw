import { Badge, useMantineTheme } from "@mantine/core";

const clientRequestStatusLabels: Record<string, string> = {
  submitted: "Submitted",
  needs_client_revision: "Needs Revision",
  payment_pending: "Payment Pending",
  for_payment_verification: "Payment Verification",
  processing: "Processing",
  for_client_review: "Client Review",
  client_rejected: "Client Rejected",
  client_approved: "Client Approved",
  completed: "Completed",
  cancelled: "Cancelled",
};

const clientRequestStatusColors: Record<string, string> = {
  submitted: "teal.7",
  needs_client_revision: "orange.9",
  payment_pending: "grape.7",
  for_payment_verification: "yellow.7",
  processing: "blue.7",
  for_client_review: "cyan.7",
  client_rejected: "red.7",
  client_approved: "indigo.6",
  completed: "green.4",
  cancelled: "red",
};

const getClientRequestStatusColor = (status: string) =>
  clientRequestStatusColors[status] ?? "gray";

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

const ClientRequestBadge = ({ status }: { status: string }) => {
  return (
    <Badge
      color={getClientRequestStatusColor(status)}
      variant=""
      size="xs"
      radius="xs"
    >
      {clientRequestStatusLabels[status] ?? status}
    </Badge>
  );
};

export {
  AreaBadge,
  PaymentBadge,
  BookingViaBadge,
  ClientRequestBadge,
  getClientRequestStatusColor,
};
