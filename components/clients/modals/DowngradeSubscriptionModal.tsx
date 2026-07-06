import DeleteModal from "@/components/Common/modal/DeleteModal";
import { ClientRow } from "@/components/data-table/columns/ClientColumns";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUnsubscribeClientMutation } from "@/store/services/userService";

interface DowngradeSubscriptionModalProps {
  opened: boolean;
  onClose: () => void;
  clientDetails: ClientRow | null;
}

export default function DowngradeSubscriptionModal({
  opened,
  onClose,
  clientDetails,
}: DowngradeSubscriptionModalProps) {
  const [unsubscribeClient, { isLoading }] = useUnsubscribeClientMutation();

  const handleCancelSubscription = async () => {
    if (!clientDetails?.email) return;

    try {
      await unsubscribeClient({ clientEmail: clientDetails.email }).unwrap();

      appNotifications.success({
        title: "Subscription Canceled",
        message: "The subscription has been canceled successfully.",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to cancel subscription",
        message: "The subscription could not be canceled. Please try again.",
      });
    }
  };

  if (!clientDetails) return null;

  return (
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Cancel Premium Subscription"
      action="cancel"
      entityType="premium subscription"
      handleDelete={handleCancelSubscription}
      isLoading={isLoading}
      confirmDisabled={!clientDetails.email}
    />
  );
}
