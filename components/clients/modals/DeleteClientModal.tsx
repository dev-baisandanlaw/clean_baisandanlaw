import SubscriptionBadge from "@/components/Common/SubscriptionBadge";
import { Client } from "@/types/user";
import { getDateFormatDisplay } from "@/utils/getDateFormatDisplay";
import { appNotifications } from "@/utils/notifications/notifications";
import { Alert, Button, Group, Modal, Stack, Table, Text } from "@mantine/core";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";
import axios from "axios";
import dayjs from "dayjs";
import { useState } from "react";

interface DeleteClientModalProps {
  opened: boolean;
  onClose: () => void;
  clientDetails: Client | null;
  setDataChanged: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DeleteClientModal({
  opened,
  onClose,
  clientDetails,
  setDataChanged,
}: DeleteClientModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/clerk/user/delete-user`, {
        data: {
          userId: clientDetails!.id,
        },
      });
      appNotifications.success({
        title: "Client deleted successfully",
        message: "The client has been deleted successfully",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to delete client",
        message: "The client could not be deleted. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!clientDetails) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Client"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isDeleting}
    >
      <Stack>
        <Alert
          color="red"
          title="Confirm Account Deletion"
          icon={<IconAlertCircle />}
        >
          Are you sure you want to delete this client? Once confirmed, the
          client will be deleted and cannot be undone.
        </Alert>

        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Client Name</Table.Th>
              <Table.Td>
                {clientDetails.first_name} {clientDetails.last_name}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Email</Table.Th>
              <Table.Td>
                {clientDetails.email_addresses[0].email_address}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Phone Number</Table.Th>
              <Table.Td>
                {clientDetails.unsafe_metadata?.phoneNumber || "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Member Since</Table.Th>
              <Table.Td>
                {getDateFormatDisplay(clientDetails.created_at, true)}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th w={160}>Subscription</Table.Th>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <SubscriptionBadge
                    isSubscribed={
                      clientDetails.unsafe_metadata?.subscription
                        ?.isSubscribed || false
                    }
                  />
                  {dayjs(
                    clientDetails.unsafe_metadata?.subscription
                      ?.subscribedEndDate
                  ).isAfter(dayjs()) && (
                    <Text size="xs" c="dimmed">
                      Valid until:{" "}
                      <Text span fw={600} c="black">
                        {clientDetails.unsafe_metadata?.subscription
                          ?.subscribedEndDate
                          ? getDateFormatDisplay(
                              clientDetails.unsafe_metadata?.subscription
                                ?.subscribedEndDate,
                              true
                            )
                          : "-"}
                      </Text>
                    </Text>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Button
          onClick={handleDeleteClient}
          loading={isDeleting}
          color="red"
          fullWidth
          leftSection={<IconTrash />}
          mt="md"
        >
          I Understand
        </Button>
      </Stack>
    </Modal>
  );
}
