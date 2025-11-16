import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Popover,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { appNotifications } from "@/utils/notifications/notifications";
import { syncToAppwrite } from "@/lib/syncToAppwrite";

interface ClientReviewModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function ClientReviewModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: ClientReviewModalProps) {
  const { user } = useUser();

  const [remarks, setRemarks] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

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
      setRemarks("");
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleApproveNotaryRequest = async () => {
    setIsReviewing(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.CLIENT_APPROVED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "CLIENT APPROVED",
              description: "Notary request approved by client",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.CLIENT_APPROVED,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
              reason: remarks,
            },
          ],
        },
        { merge: true }
      );

      await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
        status: NotaryRequestStatus.CLIENT_APPROVED,
      });

      appNotifications.success({
        title: "Notary request marked as client approved",
        message: "The notary request has been marked as client approved",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to approve notary request",
        message:
          "The notary request could not be marked as client approved. Please try again.",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRejectNotaryRequest = async () => {
    setIsReviewing(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.CLIENT_REJECTED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "CLIENT REJECTED",
              description: "Notarized preview rejected by client",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.CLIENT_REJECTED,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
              reason: remarks,
            },
          ],
        },
        { merge: true }
      );

      await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
        status: NotaryRequestStatus.CLIENT_REJECTED,
      });

      appNotifications.success({
        title: "Notary request marked as client rejected",
        message: "The notary request has been marked as client rejected",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to reject notary request",
        message:
          "The notary request could not be marked as client rejected. Please try again.",
      });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Review Finished File"
      size="lg"
      centered
      transitionProps={{ transition: "pop" }}
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
        <>
          <Text ta="center" mb="md">
            To review the finished file, please download the file and review it.
            You can check the finished document in the menu actions.
          </Text>

          <Textarea
            placeholder="Remarks"
            label="Remarks"
            minRows={6}
            autosize
            withAsterisk
            styles={{ input: { paddingBlock: 6 } }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Group justify="end" gap="md" mt="md" pos="relative">
            <Popover>
              <Popover.Target>
                <Button
                  color="red"
                  disabled={!remarks || isReviewing}
                  leftSection={<IconX />}
                >
                  Reject
                </Button>
              </Popover.Target>

              <Popover.Dropdown>
                <Stack>
                  <Text>
                    Are you sure you want to reject this notary request?
                  </Text>
                  <Button
                    color="red"
                    onClick={handleRejectNotaryRequest}
                    disabled={isReviewing}
                  >
                    Reject
                  </Button>
                </Stack>
              </Popover.Dropdown>
            </Popover>

            <Popover>
              <Popover.Target>
                <Button
                  disabled={remarks.trim() === "" || isReviewing}
                  color="green"
                  leftSection={<IconCheck />}
                >
                  Approve
                </Button>
              </Popover.Target>

              <Popover.Dropdown>
                <Stack>
                  <Text>
                    Are you sure you want to approve this notary request?
                  </Text>
                  <Button
                    color="green"
                    onClick={handleApproveNotaryRequest}
                    disabled={isReviewing}
                  >
                    Approve
                  </Button>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          </Group>
        </>
      )}
    </Modal>
  );
}
