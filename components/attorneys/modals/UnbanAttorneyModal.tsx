import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import AppModal from "@/components/Common/modal/AppModal";
import { AttorneyRow } from "@/components/data-table/columns/AttorneyColumns";
import { useUnBanAttorneyMutation } from "@/store/services/userService";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, SimpleGrid, Stack } from "@mantine/core";
import { IconAlertCircle, IconRestore } from "@tabler/icons-react";

interface UnbanAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  userDetails: AttorneyRow | null;
}

export default function UnbanAttorneyModal({
  opened,
  onClose,
  userDetails,
}: UnbanAttorneyModalProps) {
  const [unBanAttorneyFn, { isLoading: isUnbanning }] =
    useUnBanAttorneyMutation();

  const handleUnbanAttorney = async () => {
    unBanAttorneyFn({ id: userDetails!.id! })
      .unwrap()
      .then(() => {
        appNotifications.success({
          title: "Attorney unbanned successfully",
          message:
            "The attorney can now sign in again and access their account.",
        });
        onClose();
      })
      .catch((e) => {
        const message =
          e?.data?.message ||
          "The attorney could not be unbanned. Please try again.";

        appNotifications.error({
          title: "Failed to unban attorney",
          message,
        });
      });
  };

  if (!userDetails) return null;

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title="Unban Attorney"
      size="lg"
      closable={!isUnbanning}
      type="success"
    >
      <Stack>
        <Alert
          color="green"
          title="Confirm Account Unban"
          icon={<IconAlertCircle />}
        >
          Are you sure you want to unban this attorney? Once confirmed, they
          will be allowed to sign in and use their account again.
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
          onClick={handleUnbanAttorney}
          loading={isUnbanning}
          color="green"
          fullWidth
          leftSection={<IconRestore />}
          mt="md"
        >
          Confirm Unban
        </Button>
      </Stack>
    </AppModal>
  );
}
