import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import {
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
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

  const [notaryRequestData, setNotaryRequestData] =
    useState<NotaryRequest | null>(null);

  const [remarks, setRemarks] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [pickupBranch, setPickupBranch] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | string | null>(null);

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
        title: "Failed to fetch notary request data",
        message:
          "The notary request data could not be fetched. Please try again.",
      });
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!reviewAction) return;

    setIsReviewing(true);

    try {
      if (reviewAction === "reject") {
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
          { merge: true },
        );

        await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
          status: NotaryRequestStatus.CLIENT_REJECTED,
        });

        appNotifications.success({
          title: "Notary request marked as client rejected",
          message: "The notary request has been marked as client rejected",
        });
      } else if (reviewAction === "approve") {
        await setDoc(
          doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequestId),
          {
            status: NotaryRequestStatus.CLIENT_APPROVED,
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            pickupBranch: pickupBranch || "",
            pickupDate: pickupDate
              ? dayjs(pickupDate).format("YYYY-MM-DD")
              : "",
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
                pickupBranch: pickupBranch || "",
                pickupDate: pickupDate
                  ? dayjs(pickupDate).format("YYYY-MM-DD")
                  : "",
              },
            ],
          },
          { merge: true },
        );

        await syncToAppwrite("NOTARY_REQUESTS", notaryRequestId, {
          status: NotaryRequestStatus.CLIENT_APPROVED,
          pickupBranch: pickupBranch || "",
          pickupDate: pickupDate ? dayjs(pickupDate).format("YYYY-MM-DD") : "",
        });

        appNotifications.success({
          title: "Notary request marked as client approved",
          message: "The notary request has been marked as client approved",
        });
      }

      setDataChanged((prev) => !prev);
      onClose();
    } catch {
      appNotifications.error({
        title: `Failed to ${reviewAction} notary request`,
        message: `The notary request could not be marked as client ${reviewAction}ed. Please try again.`,
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownloadFile = async () => {
    const finishedFileId = notaryRequestData?.documents?.finishedFile?.id;
    if (!finishedFileId) return;

    appNotifications.info({
      title: "Downloading file",
      message: "The file is being downloaded. Please wait...",
    });

    try {
      const axios = (await import("axios")).default;
      const res = await axios.get(
        `/api/google/drive/download/${finishedFileId}`,
        {
          responseType: "blob",
        },
      );

      const disposition = res.headers["content-disposition"];
      const filenameMatch = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
      );

      let filename = "download";
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
        try {
          filename = decodeURIComponent(filename);
        } catch {
          /* Empty */
        }
      }

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      appNotifications.error({
        title: "Download failed",
        message: "Failed to download the file. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (!opened) {
      setRemarks("");
      setReviewAction(null);
      setPickupBranch(null);
      setPickupDate(null);
      setIsFetching(false);
      setNotaryRequestData(null);
    } else {
      if (notaryRequestId) {
        fetchNotaryRequest();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, notaryRequestId]);

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
            To review the finished file, you can either download{" "}
            <Anchor
              component="button"
              type="button"
              onClick={handleDownloadFile}
              disabled={!notaryRequestData?.documents?.finishedFile?.id}
              c="blue"
              fw={600}
              td="underline"
              style={{ cursor: "pointer" }}
            >
              here
            </Anchor>{" "}
            or download from the table actions.
          </Text>

          <Select
            label="Review Action"
            placeholder="Select action"
            data={[
              { value: "reject", label: "Reject" },
              { value: "approve", label: "Approve" },
            ]}
            value={reviewAction}
            onChange={(value) => {
              setReviewAction(value);
              if (value !== "approve") {
                setPickupBranch(null);
                setPickupDate(null);
              }
            }}
            withAsterisk
            mb="md"
          />

          {reviewAction === "approve" && (
            <>
              <Select
                label="Select Pickup Branch"
                placeholder="Select branch"
                data={["Angeles branch", "Magalang branch", "Soft copy only"]}
                value={pickupBranch}
                onChange={setPickupBranch}
                withAsterisk
                mb="md"
              />

              {pickupBranch !== "softcopy" && (
                <DatePickerInput
                  label="Date of Pickup"
                  placeholder="Select pickup date"
                  value={pickupDate}
                  onChange={setPickupDate}
                  withAsterisk
                  mb="md"
                  minDate={new Date()}
                />
              )}
            </>
          )}

          <Textarea
            placeholder="Please provide your feedback or any additional comments..."
            label="Remarks"
            minRows={6}
            autosize
            withAsterisk
            styles={{ input: { paddingBlock: 6 } }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Group justify="end" gap="md" mt="md">
            <Button variant="default" onClick={onClose} disabled={isReviewing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !reviewAction ||
                !remarks.trim() ||
                isReviewing ||
                (reviewAction === "approve" &&
                  (!pickupBranch ||
                    (pickupBranch !== "softcopy" && !pickupDate)))
              }
              loading={isReviewing}
              color={
                !reviewAction
                  ? undefined
                  : reviewAction === "reject"
                    ? "red"
                    : "green"
              }
            >
              {!reviewAction
                ? "Submit"
                : reviewAction === "reject"
                  ? "Reject"
                  : "Approve"}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
