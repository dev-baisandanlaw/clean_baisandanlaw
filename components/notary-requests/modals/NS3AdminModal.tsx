import {
  Button,
  Center,
  Group,
  Image,
  Loader,
  LoadingOverlay,
  Modal,
  Stack,
  Text,
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
import axios from "axios";

interface PaymentVerificationModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS3AdminModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: PaymentVerificationModalProps) {
  const { user } = useUser();
  const [isApproving, setIsApproving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const fetchNotaryRequest = async () => {
    setIsFetching(true);
    try {
      const snap = await getDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
      );
      if (snap.exists()) {
        const data = {
          ...(snap.data() as NotaryRequest),
          id: snap.id,
        };
        setNotaryRequestData(data);

        // Load receipt preview
        const receiptFileId = data.paymentFields?.receiptFileId;
        if (receiptFileId) {
          setIsLoadingPreview(true);
          try {
            const res = await axios.get(
              `/api/google/drive/download_receipts/${receiptFileId}`,
              { responseType: "blob" },
            );
            const url = URL.createObjectURL(res.data);
            setPreviewUrl(url);
          } catch {
            appNotifications.error({
              title: "Failed to load receipt",
              message:
                "The receipt image could not be loaded. You can still approve the payment.",
            });
          } finally {
            setIsLoadingPreview(false);
          }
        }
      }

      setTimeout(() => {
        setIsFetching(false);
      }, 500);
    } catch {
      appNotifications.error({
        title: "Failed to fetch  request data",
        message: "The  request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  useEffect(() => {
    if (!opened) {
      setIsFetching(false);
      setNotaryRequestData(null);
      setIsLoadingPreview(false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const handleApprovePayment = async () => {
    setIsApproving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.PROCESSING,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          paymentFields: {
            ...notaryRequestData?.paymentFields,
            isPaid: true,
          },
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "PROCESSING",
              description: "Payment verified and approved",
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
        { merge: true },
      );

      appNotifications.success({
        title: "Payment approved",
        message:
          "The payment has been verified. The request is now being processed.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to approve payment",
        message: "The payment could not be approved. Please try again.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Verify Payment"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isApproving}
      size="lg"
    >
      {isFetching ? (
        <Center my="xl">
          <Stack gap="md" align="center" justify="center">
            <Loader size="lg" type="dots" />
            <Text c="dimmed">Fetching payment details...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          <Text>
            Review the uploaded payment receipt below and approve the payment to
            begin processing.
          </Text>

          <div style={{ position: "relative", minHeight: 200 }}>
            <LoadingOverlay
              visible={isLoadingPreview}
              loaderProps={{ type: "bars" }}
            />
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Payment Receipt"
                fit="contain"
                height={400}
                width="100%"
                radius="md"
              />
            ) : (
              !isLoadingPreview && (
                <Center h={200}>
                  <Text c="dimmed">No receipt image available</Text>
                </Center>
              )
            )}
          </div>

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isApproving}>
              Cancel
            </Button>
            <Button
              color="green"
              loading={isApproving}
              onClick={handleApprovePayment}
            >
              Approve Payment
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
