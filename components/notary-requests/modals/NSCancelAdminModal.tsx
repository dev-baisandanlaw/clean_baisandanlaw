import { Dispatch, SetStateAction, useEffect, useState } from "react";

import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useUser } from "@clerk/nextjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";

import { appNotifications } from "@/utils/notifications/notifications";

import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";

interface CancelNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NSCancelAdminModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: CancelNotaryRequestModalProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
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
        title: "Failed to fetch request data",
        message: "The request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setIsFetching(false);
      setNotaryRequestData(null);
    }
    if (opened && notaryRequestId) {
      fetchNotaryRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.CANCELLED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "CANCELLED",
              description: "Request has been cancelled.",
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.CANCELLED,
              user: {
                id: user!.id,
                fullname: user!.firstName + " " + user!.lastName,
                email: user!.primaryEmailAddress!.emailAddress,
              },
            },
          ],
        },
        { merge: true },
      );

      appNotifications.success({
        title: "Request cancelled",
        message: "The request has been cancelled.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to cancel request",
        message: "The request could not be cancelled. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cancel Request"
      centered
      transitionProps={{ transition: "pop" }}
      size="md"
      withCloseButton={!isLoading}
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
          <Text>
            Are you sure you want to cancel this request? This action cannot be
            undone.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isLoading}>
              Go Back
            </Button>
            <Button color="red" loading={isLoading} onClick={handleCancel}>
              Cancel Request
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
