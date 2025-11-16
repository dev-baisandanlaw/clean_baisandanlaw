import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { appNotifications } from "@/utils/notifications/notifications";
import { syncToAppwrite } from "@/lib/syncToAppwrite";

interface RejectNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function RejectNotaryRequestModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: RejectNotaryRequestModalProps) {
  const { user } = useUser();
  const [isRejecting, setIsRejecting] = useState(false);

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
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!opened) {
      setReason("");
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleRejectNotaryRequest = async () => {
    setIsRejecting(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.REJECTED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "REJECTED",
              description: "Notary request rejected",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.REJECTED,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
              reason,
            },
          ],
        },
        { merge: true }
      );

      await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
        status: NotaryRequestStatus.REJECTED,
      });

      appNotifications.success({
        title: "Notary request rejected",
        message: "The notary request has been rejected successfully",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to reject notary request",
        message: "The notary request could not be rejected. Please try again.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Reject Notary Request"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isRejecting}
      size="lg"
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching notary request data...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Text>Please provide a reason for rejecting the notary request.</Text>

          <Textarea
            placeholder="Enter reason"
            label="Reason"
            minRows={6}
            autosize
            withAsterisk
            styles={{ input: { paddingBlock: 6 } }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!reason}
              loading={isRejecting}
              color="red"
              onClick={handleRejectNotaryRequest}
            >
              Reject
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
