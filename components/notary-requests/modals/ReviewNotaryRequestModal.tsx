import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import { Button, Group, Modal, Stack, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";

interface ReviewNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function ReviewNotaryRequestModal({
  opened,
  onClose,
  notaryRequest,
}: ReviewNotaryRequestModalProps) {
  const { user } = useUser();

  const [isReviewing, setIsReviewing] = useState(false);

  if (!notaryRequest) return null;

  const handleReviewNotaryRequest = async () => {
    setIsReviewing(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest!.id),
        {
          status: NotaryRequestStatus.PROCESSING,
          timeline: [
            ...(notaryRequest?.timeline || []),
            {
              id: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              title: "PROCESSING",
              description: "Notary request marked as processing",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.PROCESSING,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
            },
          ],
        },
        { merge: true }
      );

      appNotifications.success({
        title: "Notary request marked as processing",
        message: "The notary request has been marked as processing",
      });
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to mark notary request as processing",
        message:
          "The notary request could not be marked as processing. Please try again.",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review Notary Request"
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isReviewing}
    >
      <Stack>
        <Text>
          Are you sure you want to mark this notary request as processing?
        </Text>

        <Table variant="vertical" layout="fixed">
          <Table.Tbody>
            <Table.Tr>
              <Table.Th w={160}>Requestor</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.fullname}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Td>
                <Text c="green" fw={600} size="sm">
                  {notaryRequest?.requestor.email}
                </Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Th>Description</Table.Th>
              <Table.Td>{notaryRequest?.description}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>

        <Group justify="end">
          <Button variant="outline" onClick={onClose} disabled={isReviewing}>
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={handleReviewNotaryRequest}
            loading={isReviewing}
          >
            Mark as Processing
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
