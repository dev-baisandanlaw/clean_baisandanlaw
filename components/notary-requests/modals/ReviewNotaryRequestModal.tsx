import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { syncToAppwrite } from "@/lib/syncToAppwrite";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { appNotifications } from "@/utils/notifications/notifications";
import { useUser } from "@clerk/nextjs";
import {
  Button,
  Center,
  Loader,
  Group,
  Modal,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SetStateAction, Dispatch, useState, useEffect } from "react";

interface ReviewNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function ReviewNotaryRequestModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: ReviewNotaryRequestModalProps) {
  const { user } = useUser();

  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const fetchNotaryRequest = async () => {
    setIsFetching(true);

    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId)
      );
      if (snap.exists()) {
        setNotaryRequestData({
          ...(snap.data() as NotaryRequest),
          id: snap.id,
        });
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch notary request data",
        message:
          "The notary request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setIsReviewing(false);
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleReviewNotaryRequest = async () => {
    setIsReviewing(true);

    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.PROCESSING,
          timeline: [
            ...(notaryRequestData?.timeline || []),
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

      await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
        status: NotaryRequestStatus.PROCESSING,
      });

      appNotifications.success({
        title: "Notary request marked as processing",
        message: "The notary request has been marked as processing",
      });
      setDataChanged((prev) => !prev);
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
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching notary request data...</Text>
          </Stack>
        </Center>
      ) : (
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
                    {notaryRequestData?.requestor.fullname}
                  </Text>
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Td>
                  <Text c="green" fw={600} size="sm">
                    {notaryRequestData?.requestor.email}
                  </Text>
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Td>{notaryRequestData?.description}</Table.Td>
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
      )}
    </Modal>
  );
}
