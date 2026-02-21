import { Attorney } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, Modal, Stack, Table } from "@mantine/core";
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
      title="Delete Client"
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
          Are you sure you want to ban this attorney? Once confirmed, all their
          sessions are revoked and they are not allowed to sign in again.
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
