import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  NumberInput,
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

interface AdminConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequestId: string;
  setDataChanged: Dispatch<SetStateAction<boolean>>;
}

export default function NS2AdminModal({
  opened,
  onClose,
  notaryRequestId,
  setDataChanged,
}: AdminConfirmModalProps) {
  const { user } = useUser();
  const [isConfirming, setIsConfirming] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const [fee, setFee] = useState<number | string>("");

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
      setFee("");
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

  const isFeeValid = typeof fee === "number" && fee >= 0.01;

  const handleConfirm = async () => {
    if (!isFeeValid) return;

    setIsConfirming(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
        {
          status: NotaryRequestStatus.PAYMENT_PENDING,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          paymentFields: {
            fee: fee as number,
            receiptFileId: "",
            isPaid: false,
          },
          timeline: [
            ...(notaryRequestData?.timeline || []),
            {
              id: nanoid(8),
              title: "PAYMENT_PENDING",
              description: `Request confirmed with payment fee of ₱${(fee as number).toFixed(2)}`,
              dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
              status: NotaryRequestStatus.PAYMENT_PENDING,
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
        title: "Request confirmed",
        message: "The request has been confirmed with a payment fee.",
      });
      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: "Failed to confirm request",
        message: "The request could not be confirmed. Please try again.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirm Request"
      centered
      transitionProps={{ transition: "pop" }}
      withCloseButton={!isConfirming}
      size="md"
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
            Enter the payment fee to confirm this request. The client will be
            asked to pay this amount before processing begins.
          </Text>

          <NumberInput
            label="Payment Fee"
            placeholder="Enter payment fee"
            min={0.01}
            decimalScale={2}
            prefix="₱"
            withAsterisk
            value={fee}
            onChange={setFee}
            allowNegative={false}
          />

          <Group justify="end">
            <Button variant="outline" onClick={onClose} disabled={isConfirming}>
              Cancel
            </Button>
            <Button
              disabled={!isFeeValid}
              loading={isConfirming}
              onClick={handleConfirm}
            >
              Confirm Request
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
