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

interface RejectNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS1_5AdminModal({
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
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
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
        title: "Failed to fetch data",
        message: "The request data could not be fetched. Please try again.",
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
          status: NotaryRequestStatus.NEEDS_CLIENT_REVISION,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "NEEDS_CLIENT_REVISION",
              description: "Request sent back for client revision",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.NEEDS_CLIENT_REVISION,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
              reason,
            },
          ],
        },
        { merge: true },
      );

      appNotifications.success({
        title: "Request rejected",
        message: "The request has been rejected successfully",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to reject request",
        message: "The request could not be rejected. Please try again.",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Reject Request"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isRejecting}
      size="lg"
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching request data...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Text>Please provide a reason for rejecting the request.</Text>

          <Textarea
            placeholder="Enter reason"
            label="Reason"
            rows={6}
            withAsterisk
            styles={{ input: { paddingBlock: 6 } }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            inputWrapperOrder={["label", "input", "description", "error"]}
            description={`${reason.length}/1000 characters`}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim().length}
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
