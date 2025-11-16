import { COLLECTIONS } from "@/constants/constants";
import { sendEmail } from "@/emails/triggers/sendEmail";
import { db } from "@/firebase/config";
import { attachToResend } from "@/lib/attachToResend";
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
  Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { syncToAppwrite } from "@/lib/syncToAppwrite";
interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function ConfirmationModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: ConfirmationModalProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

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
      setIsFetching(false);
      setNotaryRequestData(null);
    }

    if (opened && notaryRequestId) {
      fetchNotaryRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const isForPickup =
    notaryRequestData?.status === NotaryRequestStatus.CLIENT_APPROVED;

  const handleReadyForPickup = async () => {
    setIsLoading(true);
    const referenceNumber = nanoid(6).toUpperCase();

    try {
      if (isForPickup) {
        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
          {
            referenceNumber,
            status: NotaryRequestStatus.FOR_PICKUP,
            timeline: [
              ...(notaryRequestData?.timeline || []),
              {
                id: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                title: "FOR PICKUP",
                description: "Notary request marked as for pickup",
                dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                status: NotaryRequestStatus.FOR_PICKUP,
                user: {
                  id: user!.id,
                  fullname: user!.firstName + " " + user!.lastName,
                  email: user!.primaryEmailAddress!.emailAddress,
                },
              },
            ],
            reason: `If claiming the document in the office, please present this reference number ${referenceNumber}`,
          },
          { merge: true }
        );

        await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
          referenceNumber,
          status: NotaryRequestStatus.FOR_PICKUP,
          search_blob: `${referenceNumber} ${notaryRequestData?.requestor?.fullname} ${notaryRequestData?.requestor?.email}`,
        });

        await sendEmail({
          to: notaryRequestData.requestor.email,
          subject: "Your Notary Request is Ready for Pickup!",
          template: "notarization-for-pickup",
          data: {
            fullname: notaryRequestData.requestor.fullname,
            referenceNumber,
          },
        });

        appNotifications.success({
          title: "Notary request ready for pickup",
          message: "The notary request has been marked as ready for pickup",
        });
        setDataChanged((prev) => !prev);
        onClose();
      } else {
        const downloadedAttachments = [];
        if (notaryRequestData?.documents?.finishedFile?.id) {
          const att = await attachToResend(
            notaryRequestData.documents.finishedFile!.id
          );
          downloadedAttachments.push(att);
        }

        await sendEmail({
          to: notaryRequestData!.requestor.email,
          subject: "Your Notary Request is Completed!",
          template: "notarization-completed",
          data: {
            fullname: notaryRequestData!.requestor.fullname,
          },
          ...(downloadedAttachments.length > 0 && {
            attachments: downloadedAttachments.map((att) => ({
              filename: att.filename,
              content: att.content,
            })),
          }),
        });

        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
          {
            status: NotaryRequestStatus.COMPLETED,
            timeline: [
              ...(notaryRequestData?.timeline || []),
              {
                id: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                title: "COMPLETED",
                description: "Notary request is completed.",
                dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                status: NotaryRequestStatus.COMPLETED,
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
          status: NotaryRequestStatus.COMPLETED,
        });

        appNotifications.success({
          title: "Notary request marked as completed",
          message: "The notary request has been marked as completed",
        });
        setDataChanged((prev) => !prev);
        onClose();
      }
    } catch {
      appNotifications.error({
        title: "Failed to process notary request",
        message: "The notary request could not be processed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isForPickup ? "For Pickup" : "Complete Notary Request"}
      centered
      transitionProps={{ transition: "pop" }}
      size="lg"
      withCloseButton={!isLoading}
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
          <Text>
            {isForPickup ? (
              <>
                Are you sure you want to notify the client that this
                notarization is ready for pickup? This will send the finished
                document to their email (
                <Text span style={{ fontWeight: "bold" }}>
                  {notaryRequestData.requestor.email}
                </Text>
                ). Modifications are no longer allowed.
              </>
            ) : (
              "Are you sure you want to complete this notarization request and the document has been picked up by the client?"
            )}
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>

            <Button loading={isLoading} onClick={handleReadyForPickup}>
              {isForPickup ? "For pickup" : "Complete"}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
