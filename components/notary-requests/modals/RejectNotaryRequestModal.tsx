import { Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { COLLECTIONS } from "@/constants/constants";
import { useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { appNotifications } from "@/utils/notifications/notifications";

interface RejectNotaryRequestModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function RejectNotaryRequestModal({
  opened,
  onClose,
  notaryRequest,
}: RejectNotaryRequestModalProps) {
  const { user } = useUser();
  const [isRejecting, setIsRejecting] = useState(false);

  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!opened) setReason("");
  }, [opened]);

  const handleRejectNotaryRequest = async () => {
    setIsRejecting(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest!.id),
        {
          status: NotaryRequestStatus.REJECTED,
          updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          timeline: [
            ...(notaryRequest?.timeline || []),
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

      appNotifications.success({
        title: "Notary request rejected",
        message: "The notary request has been rejected successfully",
      });
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

  if (!notaryRequest) return null;

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
    </Modal>
  );
}
