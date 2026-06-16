import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import { AttorneyRow } from "@/components/data-table/columns/AttorneyColumns";
import { useBanAttorneyMutation } from "@/store/services/userService";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, SimpleGrid, Stack } from "@mantine/core";
import { IconAlertCircle, IconBan } from "@tabler/icons-react";

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
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Restrict Attorney"
      size="lg"
      closable={!isBanning}
      type="danger"
    >
      <Stack>
        <Alert
          color="red"
          title="Confirm Account Ban"
          icon={<IconAlertCircle />}
        >
          Are you sure you want to restrict this attorney? Once confirmed, all
          their sessions are revoked and they are not allowed to sign in again.
        </Alert>

        <BasicCard title="Attorney's Information">
          <SimpleGrid cols={2}>
            <DetailField title="Name" value={userDetails.fullname} />
            <DetailField title="Email" value={userDetails.email} />
            <DetailField title="Phone" value={userDetails.phone} />
            <DetailField
              title="Member Since"
              value={getDateFormatDisplay(userDetails?.metadata?.createdAt)}
            />
          </SimpleGrid>
        </BasicCard>

        <Button
          onClick={handleDeleteClient}
          loading={isBanning}
          color="red.7"
          fullWidth
          leftSection={<IconBan />}
          mt="md"
        >
          I Understand
        </Button>
      </Stack>
    </AppModal>
  );
}
