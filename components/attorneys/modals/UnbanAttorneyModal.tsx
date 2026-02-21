import { Attorney } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, Modal, Stack, Table } from "@mantine/core";
import { IconAlertCircle, IconRestore } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";

interface UnbanAttorneyModalProps {
  opened: boolean;
  onClose: () => void;
  userDetails: Attorney | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UnbanAttorneyModal({
  opened,
  onClose,
  userDetails,
  setDataChanged,
}: UnbanAttorneyModalProps) {
  const [isUnbanning, setIsUnbanning] = useState(false);

  const handleUnbanAttorney = async () => {
    setIsUnbanning(true);
    try {
      await axios.post("/api/clerk/user/unban-user", {
        userId: userDetails!.id,
      });
      appNotifications.success({
        title: "Attorney unbanned successfully",
        message: "The attorney can now sign in again and access their account.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to unban attorney",
        message: "The attorney could not be unbanned. Please try again.",
      });
    } finally {
      setIsUnbanning(false);
    }
  };

  if (!userDetails) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Unban Attorney"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isUnbanning}
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

        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Attorney Name</Table.Th>
              <Table.Td>
                {userDetails.first_name} {userDetails.last_name}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Email</Table.Th>
              <Table.Td>
                {userDetails.email_addresses[0].email_address}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Phone Number</Table.Th>
              <Table.Td>
                {userDetails.unsafe_metadata?.phoneNumber || "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Member Since</Table.Th>
              <Table.Td>
                {getDateFormatDisplay(userDetails.created_at, true)}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

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
    </Modal>
  );
}
