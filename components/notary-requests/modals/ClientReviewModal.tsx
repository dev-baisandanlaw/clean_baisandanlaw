import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import {
  Button,
  Group,
  Modal,
  Popover,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useUser } from "@clerk/nextjs";
import { appNotifications } from "@/utils/notifications/notifications";

interface ClientReviewModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function ClientReviewModal({
  opened,
  onClose,
  notaryRequest,
}: ClientReviewModalProps) {
  const { user } = useUser();

  const [remarks, setRemarks] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    if (!opened) {
      setRemarks("");
    }
  }, [opened]);

  const handleApproveNotaryRequest = async () => {
    setIsReviewing(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest!.id),
        {
          status: NotaryRequestStatus.CLIENT_APPROVED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequest?.timeline || []),
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

      appNotifications.success({
        title: "Notary request marked as client approved",
        message: "The notary request has been marked as client approved",
      });
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
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest!.id),
        {
          status: NotaryRequestStatus.CLIENT_REJECTED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequest?.timeline || []),
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

      appNotifications.success({
        title: "Notary request marked as client rejected",
        message: "The notary request has been marked as client rejected",
      });
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

  if (!notaryRequest) return null;

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
      <Text ta="center" mb="md">
        To review the finished file, please download the file and review it. You
        can check the finished document in the menu actions.
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
              <Text>Are you sure you want to reject this notary request?</Text>
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
              <Text>Are you sure you want to approve this notary request?</Text>
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
    </Modal>
  );
}
