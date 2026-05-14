import BasicCard from "@/components/Common/BasicCard";
import DetailField from "@/components/Common/DetailField";
import { Attorney } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, Modal, SimpleGrid, Stack } from "@mantine/core";
import { IconAlertCircle, IconBan } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";

interface BanAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  userDetails: Attorney | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BanAttorneyModal({
  opened,
  onClose,
  userDetails,
  setDataChanged,
}: BanAttorneyModalProps) {
  const [isBanning, setIsBanning] = useState(false);

  const handleDeleteClient = async () => {
    setIsBanning(true);
    try {
      await axios.post("/api/clerk/user/ban-user", {
        userId: userDetails!.id,
      });
      appNotifications.success({
        title: "Attorney banned successfully",
        message:
          "The attorney’s session has been revoked and they are no longer able to log in.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to delete client",
        message: "The attorney could not be deleted. Please try again.",
      });
    } finally {
      setIsBanning(false);
    }
  };

  if (!userDetails) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Restrict Attorney"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isBanning}
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
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
            <DetailField
              title="Name"
              value={userDetails.first_name + " " + userDetails.last_name}
            />
            <DetailField
              title="Email"
              value={userDetails.email_addresses[0].email_address}
            />
            <DetailField
              title="Phone"
              value={userDetails.unsafe_metadata?.phoneNumber || "-"}
            />
            <DetailField
              title="Involved Cases"
              value={userDetails.unsafe_metadata?.involvedCases || 0}
            />
            <DetailField
              title="Member Since"
              value={getDateFormatDisplay(userDetails.created_at, true)}
            />
          </SimpleGrid>
        </BasicCard>

        <Button
          onClick={handleDeleteClient}
          loading={isBanning}
          color="red"
          fullWidth
          leftSection={<IconBan />}
          mt="md"
        >
          I Understand
        </Button>
      </Stack>
    </Modal>
  );
}
