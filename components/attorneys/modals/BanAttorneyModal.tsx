import DeleteModal from "@/components/Common/modal/DeleteModal";
import { AttorneyRow } from "@/components/data-table/columns/AttorneyColumns";
import { useBanAttorneyMutation } from "@/store/services/userService";
import { appNotifications } from "@/utils/notifications/notifications";
import { IconBan } from "@tabler/icons-react";

interface BanAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  userDetails: AttorneyRow | null;
}

export default function BanAttorneyModal({
  opened,
  onClose,
  userDetails,
}: BanAttorneyModalProps) {
  const [banAttorneyFn, { isLoading: isBanning }] = useBanAttorneyMutation();

  const handleDeleteClient = async () => {
    banAttorneyFn({ id: userDetails!.id! })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Attorney banned successfully",
          message:
            "The attorney’s session has been revoked and they are no longer able to log in.",
        });
        onClose();
      })
      .catch((e) => {
        const message =
          e?.data?.message ||
          "The attorney could not be banned. Please try again.";

        appNotifications.error({
          title: "Failed to ban attorney",
          message,
        });
      });
  };

  if (!userDetails) return null;

  return (
    <DeleteModal
      opened={opened}
      onClose={onClose}
      title="Restrict Attorney"
      action="restrict"
      entityType="attorney"
      handleDelete={handleDeleteClient}
      isLoading={isBanning}
      confirmIcon={<IconBan size={16} />}
    />
  );
}
