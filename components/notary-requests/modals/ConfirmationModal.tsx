import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { useUser } from "@clerk/nextjs";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { toast } from "react-toastify";

interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  notaryRequest: NotaryRequest | null;
}

export default function ConfirmationModal({
  opened,
  onClose,
  notaryRequest,
}: ConfirmationModalProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  if (!notaryRequest) return null;

  const isForPickup =
    notaryRequest.status === NotaryRequestStatus.CLIENT_APPROVED;

  const handleReadyForPickup = async () => {
    setIsLoading(true);
    try {
      if (isForPickup) {
        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
          {
            status: NotaryRequestStatus.FOR_PICKUP,
            timeline: [
              ...(notaryRequest?.timeline || []),
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
            reason: `If claiming the document in the office, please present this reference number ${notaryRequest.id}`,
          },
          { merge: true }
        );

        toast.success("Notary request marked as for pickup");
        onClose();
      } else {
        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
          {
            status: NotaryRequestStatus.COMPLETED,
            timeline: [
              ...(notaryRequest?.timeline || []),
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

        toast.success("Notary request marked as completed");
        onClose();
      }
    } catch {
      toast.error("An error occurred");
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
      <Stack gap="md">
        <Text>
          {isForPickup ? (
            <>
              Are you sure you want to notify the client that this notarization
              is ready for pickup? This will send the finished document to their
              email (
              <Text style={{ fontWeight: "bold" }}>
                {notaryRequest.requestor.email}
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
    </Modal>
  );
}
